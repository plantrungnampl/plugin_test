#!/usr/bin/env node

/**
 * Oracle Database MCP Server for ASP.NET WebForms
 * Supports flexible Oracle Instant Client configuration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import oracledb from 'oracledb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// FLEXIBLE ORACLE CLIENT CONFIGURATION
// ============================================

/**
 * Hỗ trợ nhiều cách config Oracle Client:
 * 1. Environment variable: ORACLE_CLIENT_DIR
 * 2. Config file: oracle-config.json
 * 3. Default paths by platform
 * 4. Bundled with plugin
 */

async function getOracleClientPath() {
  // Option 1: Environment variable (HIGHEST PRIORITY)
  if (process.env.ORACLE_CLIENT_DIR) {
    console.error(`Using Oracle Client from env: ${process.env.ORACLE_CLIENT_DIR}`);
    return process.env.ORACLE_CLIENT_DIR;
  }

  // Option 2: Config file in plugin directory
  try {
    const configPath = path.join(__dirname, 'oracle-config.json');
    const fs = await import('fs');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.oracleClientDir) {
        console.error(`Using Oracle Client from config: ${config.oracleClientDir}`);
        return config.oracleClientDir;
      }
    }
  } catch (err) {
    // Config file không tồn tại hoặc invalid, continue to defaults
  }

  // Option 3: Platform-specific defaults
  const platform = process.platform;
  const defaultPaths = {
    win32: [
      'C:\\oracle\\instantclient\\instantclient_23_9',
      'C:\\oracle\\instantclient_23_9',
      'C:\\oracle\\instantclient',
      'C:\\tools\\oracle\\instantclient'
    ],
    linux: [
      '/usr/lib/oracle/21/client64/lib',
      '/opt/oracle/instantclient_21_9',
      '/usr/local/oracle/instantclient'
    ],
    darwin: [
      '/opt/oracle/instantclient_19_8',
      '/usr/local/lib/instantclient'
    ]
  };

  const paths = defaultPaths[platform] || [];
  
  // Try each default path
  for (const testPath of paths) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(testPath)) {
        console.error(`Using Oracle Client from default: ${testPath}`);
        return testPath;
      }
    } catch (err) {
      continue;
    }
  }

  // Option 4: Check if bundled with plugin
  const bundledPath = path.join(__dirname, 'oracle-client');
  try {
    const fs = await import('fs');
    if (fs.existsSync(bundledPath)) {
      console.error(`Using bundled Oracle Client: ${bundledPath}`);
      return bundledPath;
    }
  } catch (err) {
    // Not bundled
  }

  console.error('⚠️  No Oracle Client found. MCP will try Thin Mode.');
  return null;
}

// Initialize Oracle Client (Thick Mode if available)
const oracleClientPath = getOracleClientPath();

if (oracleClientPath) {
  try {
    oracledb.initOracleClient({ libDir: oracleClientPath });
    console.error('✅ Oracle Thick Mode initialized successfully');
  } catch (err) {
    console.error('⚠️  Failed to initialize Thick Mode:', err.message);
    console.error('Will try Thin Mode instead...');
  }
} else {
  console.error('ℹ️  Using Oracle Thin Mode (no client library needed)');
}

// ============================================
// FLEXIBLE DATABASE CONFIGURATION
// ============================================

const dbConfig = {
  user: process.env.ORACLE_USER || "your_user",
  password: process.env.ORACLE_PASSWORD || "your_password",
  connectString: process.env.ORACLE_CONNECT_STRING || "localhost:1521/XE"
};

// Validate config
if (dbConfig.user === "your_user" || dbConfig.password === "your_password") {
  console.error('⚠️  WARNING: Using default credentials. Set ORACLE_USER and ORACLE_PASSWORD env vars!');
}

// Connection pool
let pool;

async function initPool() {
  try {
    pool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
      poolTimeout: 60,
      queueTimeout: 60000
    });
    console.error(`✅ Connection pool created (${dbConfig.user}@${dbConfig.connectString})`);
  } catch (err) {
    console.error('❌ Failed to create connection pool:', err.message);
    throw err;
  }
}

// ============================================
// MCP SERVER SETUP
// ============================================

const server = new Server(
  { 
    name: "oracle-aspnet-tools", 
    version: "1.0.0" 
  },
  { 
    capabilities: { 
      tools: {} 
    } 
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query_db",
        description: "Run SQL SELECT query on Oracle Database (read-only, parameterized)",
        inputSchema: {
          type: "object",
          properties: {
            sql: { 
              type: "string", 
              description: "The SELECT statement (bind vars as :1, :2, etc.)" 
            },
            params: { 
              type: "array", 
              description: "Optional bind parameters (prevent SQL injection)",
              items: {}
            }
          },
          required: ["sql"]
        }
      },
      {
        name: "get_schema",
        description: "Get column information of a table (name, type, nullable, default)",
        inputSchema: {
          type: "object",
          properties: { 
            tableName: { 
              type: "string",
              description: "Table name (case-insensitive, will be converted to uppercase)"
            }
          },
          required: ["tableName"]
        }
      },
      {
        name: "list_tables",
        description: "List all accessible tables in current schema with row counts",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "execute_plsql",
        description: "Execute PL/SQL block (stored procedures, functions)",
        inputSchema: {
          type: "object",
          properties: {
            plsql: {
              type: "string",
              description: "PL/SQL block to execute"
            },
            bindVars: {
              type: "object",
              description: "Bind variables as key-value pairs"
            }
          },
          required: ["plsql"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  let connection;
  
  try {
    connection = await pool.getConnection();

    // ==================== query_db ====================
    if (request.params.name === "query_db") {
      const { sql, params = [] } = request.params.arguments;
      
      // Security: Only allow SELECT and WITH statements
      const trimmedSql = sql.trim().toUpperCase();
      if (!trimmedSql.startsWith("SELECT") && !trimmedSql.startsWith("WITH")) {
        return { 
          content: [{ 
            type: "text", 
            text: "❌ Security Error: Only SELECT and WITH queries are allowed for safety" 
          }], 
          isError: true 
        };
      }

      const result = await connection.execute(sql, params, { 
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        maxRows: 1000 // Limit rows for performance
      });
      
      return { 
        content: [{ 
          type: "text", 
          text: `✅ Query executed successfully\n\nRows returned: ${result.rows.length}\n\n${JSON.stringify(result.rows, null, 2)}` 
        }] 
      };
    }

    // ==================== get_schema ====================
    if (request.params.name === "get_schema") {
      const { tableName } = request.params.arguments;
      
      const sql = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE, 
          DATA_LENGTH, 
          DATA_PRECISION,
          DATA_SCALE,
          NULLABLE, 
          DATA_DEFAULT
        FROM ALL_TAB_COLUMNS 
        WHERE TABLE_NAME = :1
        ORDER BY COLUMN_ID
      `;
      
      const result = await connection.execute(
        sql, 
        [tableName.toUpperCase()], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      if (result.rows.length === 0) {
        return { 
          content: [{ 
            type: "text", 
            text: `⚠️  Table '${tableName}' not found or you don't have access to it` 
          }] 
        };
      }
      
      return { 
        content: [{ 
          type: "text", 
          text: `✅ Schema for table '${tableName}':\n\n${JSON.stringify(result.rows, null, 2)}` 
        }] 
      };
    }

    // ==================== list_tables ====================
    if (request.params.name === "list_tables") {
      const sql = `
        SELECT 
          TABLE_NAME, 
          NUM_ROWS,
          TABLESPACE_NAME
        FROM USER_TABLES 
        ORDER BY TABLE_NAME
      `;
      
      const result = await connection.execute(sql, [], { 
        outFormat: oracledb.OUT_FORMAT_OBJECT 
      });
      
      return { 
        content: [{ 
          type: "text", 
          text: `✅ Found ${result.rows.length} tables in your schema:\n\n${JSON.stringify(result.rows, null, 2)}` 
        }] 
      };
    }

    // ==================== execute_plsql ====================
    if (request.params.name === "execute_plsql") {
      const { plsql, bindVars = {} } = request.params.arguments;
      
      const result = await connection.execute(plsql, bindVars, {
        autoCommit: false // Safety: Don't auto-commit
      });
      
      return {
        content: [{
          type: "text",
          text: `✅ PL/SQL executed successfully\n\nRows affected: ${result.rowsAffected || 0}\n\nOutput: ${JSON.stringify(bindVars, null, 2)}`
        }]
      };
    }

    return { 
      content: [{ 
        type: "text", 
        text: `❌ Unknown tool: ${request.params.name}` 
      }], 
      isError: true 
    };

  } catch (error) {
    return { 
      content: [{ 
        type: "text", 
        text: `❌ Database Error: ${error.message}\n\nCode: ${error.errorNum || 'N/A'}\n\nDetails: ${error.stack}` 
      }], 
      isError: true 
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('⚠️  Error closing connection:', err.message);
      }
    }
  }
});

// ============================================
// SERVER STARTUP
// ============================================

async function run() {
  try {
    await initPool();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('====================================');
    console.error('✅ Oracle MCP Server started');
    console.error(`📊 Database: ${dbConfig.connectString}`);
    console.error(`👤 User: ${dbConfig.user}`);
    console.error(`🔧 Mode: ${oracleClientPath ? 'Thick' : 'Thin'}`);
    console.error('====================================');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function shutdown() {
  console.error('Shutting down Oracle MCP Server...');
  
  if (pool) {
    try {
      await pool.close(10); // 10 second drain timeout
      console.error('✅ Connection pool closed');
    } catch (err) {
      console.error('⚠️  Error closing pool:', err.message);
    }
  }
  
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});