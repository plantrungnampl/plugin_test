#!/usr/bin/env node

/**
 * ASP.NET WebForms Analysis Tools MCP Server
 * Provides tools for analyzing WebForms code (ViewState, SQL injection, etc.)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

const TOOLS = [
  {
    name: 'analyze_viewstate',
    description: 'Analyze ViewState usage in ASPX files - checks EnableViewState settings and provides optimization recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path to ASPX file to analyze'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'check_sql_injection',
    description: 'Scan code-behind files for SQL injection vulnerabilities - detects string concatenation, missing parameters',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path to .cs code-behind file'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'analyze_postback',
    description: 'Analyze postback patterns - AutoPostBack usage, UpdatePanels, IsPostBack checks',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path to ASPX or code-behind file'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'find_webforms_files',
    description: 'Find all WebForms files (.aspx, .ascx, .master) in a directory',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Directory path to search'
        },
        recursive: {
          type: 'boolean',
          description: 'Search recursively (default: true)',
          default: true
        }
      },
      required: ['directory']
    }
  },
  {
    name: 'scan_project_health',
    description: 'Comprehensive WebForms project health check - scans for common issues, anti-patterns, security vulnerabilities',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to WebForms project root'
        }
      },
      required: ['projectPath']
    }
  }
];

// Tool implementations
async function analyzeViewState(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    const viewStateMatch = content.match(/EnableViewState="(true|false)"/gi);
    const viewStateControls = viewStateMatch ? viewStateMatch.length : 0;
    
    const pageDirective = content.match(/<%@\s*Page[^%>]*%>/i);
    const pageViewState = pageDirective ? 
      pageDirective[0].includes('EnableViewState') : false;
    
    const totalControls = (content.match(/runat="server"/gi) || []).length;
    
    let recommendations = [];
    if (viewStateControls > 10) {
      recommendations.push('Consider disabling ViewState on read-only controls');
    }
    if (!pageViewState && viewStateControls > 0) {
      recommendations.push('Set ViewState at page level for better control');
    }
    if (totalControls > 50) {
      recommendations.push('High control count detected - consider breaking into User Controls');
    }
    
    return {
      file: filePath,
      viewStateControls: viewStateControls,
      totalControls: totalControls,
      pageViewStateSet: pageViewState,
      viewStateRatio: totalControls > 0 ? (viewStateControls / totalControls * 100).toFixed(1) + '%' : '0%',
      recommendations: recommendations.length > 0 ? recommendations : ['ViewState usage looks optimized'],
      severity: viewStateControls > 15 ? 'HIGH' : viewStateControls > 10 ? 'MEDIUM' : 'LOW'
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function checkSqlInjection(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    const findings = [];
    
    // Pattern 1: String concatenation in SQL
    const concatPattern = /new\s+(SqlCommand|OracleCommand)\s*\([^)]*\+[^)]*\)/gi;
    const concatMatches = content.match(concatPattern);
    if (concatMatches) {
      findings.push({
        severity: 'CRITICAL',
        type: 'String Concatenation in SQL',
        count: concatMatches.length,
        message: 'SQL commands using string concatenation - CRITICAL SQL injection risk',
        examples: concatMatches.slice(0, 3)
      });
    }
    
    // Pattern 2: String interpolation
    const interpolationPattern = /\$"[^"]*SELECT[^"]*{[^}]+}/gi;
    const interpolationMatches = content.match(interpolationPattern);
    if (interpolationMatches) {
      findings.push({
        severity: 'CRITICAL',
        type: 'String Interpolation in SQL',
        count: interpolationMatches.length,
        message: 'SQL queries using string interpolation - HIGH injection risk'
      });
    }
    
    // Pattern 3: Check for parameterized queries (good!)
    const paramPattern = /@\w+|:\w+/g;
    const parameters = content.match(paramPattern);
    const hasParameters = parameters && parameters.length > 0;
    
    // Pattern 4: Dynamic SQL execution
    const dynamicSqlPattern = /ExecuteNonQuery|ExecuteScalar|ExecuteReader/gi;
    const dynamicSqlMatches = content.match(dynamicSqlPattern);
    
    return {
      file: filePath,
      vulnerabilities: findings,
      hasParameterizedQueries: hasParameters,
      parameterCount: parameters ? parameters.length : 0,
      sqlExecutionCount: dynamicSqlMatches ? dynamicSqlMatches.length : 0,
      recommendation: findings.length > 0 ?
        'CRITICAL: Replace string concatenation/interpolation with parameterized queries immediately!' :
        'No obvious SQL injection vulnerabilities detected. Good use of parameterized queries.',
      riskLevel: findings.length > 0 ? 'CRITICAL' : 'LOW',
      score: findings.length === 0 && hasParameters ? 100 : findings.length === 0 ? 80 : 20
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function analyzePostback(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    const findings = {
      autoPostBack: (content.match(/AutoPostBack="true"/gi) || []).length,
      updatePanels: (content.match(/<asp:UpdatePanel/gi) || []).length,
      isPostBackChecks: (content.match(/IsPostBack/gi) || []).length,
      viewStateMode: content.match(/ViewStateMode="(Inherit|Enabled|Disabled)"/i)?.[1] || 'Not set',
      scriptManagers: (content.match(/<asp:ScriptManager/gi) || []).length
    };
    
    const recommendations = [];
    const issues = [];
    
    if (findings.autoPostBack > 5) {
      issues.push('HIGH: Excessive AutoPostBack controls (' + findings.autoPostBack + ')');
      recommendations.push('Reduce AutoPostBack controls - consider client-side validation');
    }
    
    if (findings.autoPostBack > 0 && findings.isPostBackChecks === 0) {
      issues.push('MEDIUM: No IsPostBack checks detected');
      recommendations.push('Add !IsPostBack checks in Page_Load to avoid redundant data loading');
    }
    
    if (findings.updatePanels > 3) {
      issues.push('MEDIUM: Multiple UpdatePanels (' + findings.updatePanels + ')');
      recommendations.push('Consider consolidating UpdatePanels for better performance');
    }
    
    if (findings.updatePanels > 0 && findings.scriptManagers === 0) {
      issues.push('CRITICAL: UpdatePanel without ScriptManager');
      recommendations.push('Add ScriptManager to page for AJAX functionality');
    }
    
    const performanceImpact = 
      findings.autoPostBack > 10 ? 'CRITICAL' :
      findings.autoPostBack > 5 ? 'HIGH' :
      findings.autoPostBack > 2 ? 'MEDIUM' : 'LOW';
    
    return {
      file: filePath,
      findings,
      issues: issues.length > 0 ? issues : ['No major postback issues detected'],
      recommendations: recommendations.length > 0 ? recommendations : ['Postback patterns look optimized'],
      performanceImpact,
      score: issues.length === 0 ? 100 : Math.max(20, 100 - (issues.length * 20))
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function findWebFormsFiles(directory, recursive = true) {
  try {
    const files = [];
    
    async function scan(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && recursive) {
          if (!['bin', 'obj', 'node_modules', '.git', 'packages'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.aspx', '.ascx', '.master', '.cs'].includes(ext)) {
            const isCodeBehind = entry.name.endsWith('.aspx.cs') || 
                                 entry.name.endsWith('.ascx.cs') ||
                                 entry.name.endsWith('.master.cs');
            
            files.push({
              path: fullPath,
              type: ext,
              name: entry.name,
              isCodeBehind
            });
          }
        }
      }
    }
    
    await scan(directory);
    
    return {
      directory,
      filesFound: files.length,
      files: files,
      breakdown: {
        aspx: files.filter(f => f.type === '.aspx' && !f.isCodeBehind).length,
        aspxCs: files.filter(f => f.name.endsWith('.aspx.cs')).length,
        ascx: files.filter(f => f.type === '.ascx' && !f.isCodeBehind).length,
        ascxCs: files.filter(f => f.name.endsWith('.ascx.cs')).length,
        master: files.filter(f => f.type === '.master' && !f.isCodeBehind).length,
        masterCs: files.filter(f => f.name.endsWith('.master.cs')).length
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function scanProjectHealth(projectPath) {
  try {
    const report = {
      projectPath,
      timestamp: new Date().toISOString(),
      summary: {},
      issues: [],
      recommendations: []
    };
    
    // Find all files
    const fileResults = await findWebFormsFiles(projectPath, true);
    report.summary.totalFiles = fileResults.filesFound;
    report.summary.breakdown = fileResults.breakdown;
    
    // Sample analysis on first 10 files
    const filesToAnalyze = fileResults.files.slice(0, 10);
    let totalViewStateIssues = 0;
    let totalSqlInjectionRisks = 0;
    let totalPostbackIssues = 0;
    
    for (const file of filesToAnalyze) {
      if (file.type === '.aspx') {
        const vsResult = await analyzeViewState(file.path);
        if (vsResult.severity === 'HIGH') totalViewStateIssues++;
        
        const pbResult = await analyzePostback(file.path);
        if (pbResult.performanceImpact === 'HIGH' || pbResult.performanceImpact === 'CRITICAL') {
          totalPostbackIssues++;
        }
      }
      
      if (file.isCodeBehind) {
        const sqlResult = await checkSqlInjection(file.path);
        if (sqlResult.riskLevel === 'CRITICAL') totalSqlInjectionRisks++;
      }
    }
    
    // Summary
    report.summary.viewStateIssues = totalViewStateIssues;
    report.summary.sqlInjectionRisks = totalSqlInjectionRisks;
    report.summary.postbackIssues = totalPostbackIssues;
    
    // Overall health score
    const maxIssues = filesToAnalyze.length;
    const totalIssues = totalViewStateIssues + totalSqlInjectionRisks + totalPostbackIssues;
    report.summary.healthScore = Math.max(0, Math.round((1 - totalIssues / (maxIssues * 3)) * 100));
    
    // Issues
    if (totalSqlInjectionRisks > 0) {
      report.issues.push(`CRITICAL: ${totalSqlInjectionRisks} files with SQL injection risks`);
      report.recommendations.push('Immediately audit and fix SQL injection vulnerabilities');
    }
    if (totalViewStateIssues > 0) {
      report.issues.push(`HIGH: ${totalViewStateIssues} files with ViewState concerns`);
      report.recommendations.push('Optimize ViewState usage for better performance');
    }
    if (totalPostbackIssues > 0) {
      report.issues.push(`MEDIUM: ${totalPostbackIssues} files with excessive postbacks`);
      report.recommendations.push('Reduce AutoPostBack usage and implement AJAX patterns');
    }
    
    if (report.issues.length === 0) {
      report.issues.push('No critical issues detected in sampled files');
      report.recommendations.push('Continue following best practices');
    }
    
    return report;
  } catch (error) {
    return { error: error.message };
  }
}

// Create server
const server = new Server(
  {
    name: 'aspnet-webforms-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'analyze_viewstate':
        result = await analyzeViewState(args.filePath);
        break;
        
      case 'check_sql_injection':
        result = await checkSqlInjection(args.filePath);
        break;
        
      case 'analyze_postback':
        result = await analyzePostback(args.filePath);
        break;
        
      case 'find_webforms_files':
        result = await findWebFormsFiles(args.directory, args.recursive ?? true);
        break;
        
      case 'scan_project_health':
        result = await scanProjectHealth(args.projectPath);
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: error.message }, null, 2)
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ASP.NET WebForms Tools MCP Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});