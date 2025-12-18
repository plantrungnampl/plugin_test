---
name: ultra-think
description: 10-step deep analysis framework for complex problems requiring multi-dimensional thinking, trade-off analysis, and strategic decision-making. Activates on "Deep Analysis", "System Design", or "Migration Strategy" requests.
---

# Deep Analysis and Problem Solving Mode

## When to Use Ultra-Think

This skill **automatically activates** when:
- User explicitly requests: "Deep Analysis:", "System Design:", "Migration Strategy:"
- Task involves major architectural changes or complex refactoring
- Decision requires multi-factor trade-off analysis or risk assessment
- System-wide impacts need comprehensive evaluation

## 10-Step Ultra-Think Framework

### 1. Initialize Ultra Think Mode
- Acknowledge the request for enhanced analytical thinking
- Set context for deep, systematic reasoning
- Prepare to explore the problem space comprehensively
- Confirm the scope and boundaries of analysis

### 2. Parse the Problem or Question
Extract the core challenge from **the user's current request or task context**:
- Identify all stakeholders and constraints
- Recognize implicit requirements and hidden complexities
- Question assumptions and surface unknowns
- Distinguish "must-haves" from "nice-to-haves"

### 3. Multi-Dimensional Analysis
Approach the problem from multiple angles:

#### Technical Perspective
- Analyze technical feasibility and constraints
- Consider scalability, performance, and maintainability
- Evaluate security implications (SQL Injection, XSS in WebForms, CSRF)
- Assess technical debt and future-proofing
- Review technology stack compatibility
- Consider development team capabilities

#### Business Perspective
- Understand business value and ROI
- Consider time-to-market pressures
- Evaluate competitive advantages
- Assess risk vs. reward trade-offs
- Factor in budget constraints
- Consider organizational change management

#### User Perspective
- Analyze user needs and pain points
- Consider usability and accessibility
- Evaluate user experience implications
- Think about edge cases and user journeys
- Consider user training requirements
- Assess impact on different user personas

#### System Perspective
- Consider system-wide impacts (Database, Session State, Cache)
- Analyze integration points and APIs
- Evaluate dependencies and coupling
- Think about emergent behaviors
- Consider monitoring and observability
- Plan for disaster recovery

### 4. Generate Multiple Solutions
Brainstorm **at least 3-5 different approaches**:

For each approach, analyze:
- **Pros**: Benefits, advantages, opportunities
- **Cons**: Drawbacks, limitations, risks
- **Implementation Complexity**: Effort estimation (hours/days/weeks)
- **Resource Requirements**: Team, tools, infrastructure
- **Potential Risks**: Technical, business, operational
- **Long-term Implications**: Maintainability, scalability, evolution

Include:
- Conventional "safe" solutions
- Creative innovative approaches
- Hybrid combinations
- Phased implementation options

### 5. Deep Dive Analysis
For the **most promising 2-3 solutions**:

- Create detailed implementation plans with milestones
- Identify potential pitfalls and mitigation strategies
- Consider phased approaches and MVPs
- Analyze second and third-order effects
- Think through failure modes and recovery paths
- Estimate total cost of ownership (TCO)
- Plan rollback strategies

### 6. Cross-Domain Thinking
Expand perspective beyond immediate domain:

- Draw parallels from other industries (e.g., manufacturing, healthcare)
- Apply design patterns from different contexts (microservices, event sourcing)
- Look for innovative combinations of existing solutions
- Consider how other companies solved similar problems
- Explore emerging technologies or methodologies
- Think about lessons from past failures

### 7. Challenge and Refine
Play devil's advocate with each solution:

- **Red Team Thinking**: Attack each solution's weaknesses
- Identify blind spots and hidden assumptions
- Consider "what if" worst-case scenarios
- Stress-test under extreme conditions
- Challenge conventional wisdom
- Ask "why not" questions
- Explore contrarian perspectives

### 8. Synthesize Insights
Combine insights from all perspectives:

- Connect dots between different analyses
- Identify key decision factors and critical path
- Highlight critical trade-offs (time vs. quality, cost vs. features)
- Summarize innovative discoveries
- Extract universal principles
- Create decision matrices

### 9. Provide Structured Recommendations
Present findings in clear, actionable format:

## Problem Analysis
- **Core Challenge**: [One sentence problem statement]
- **Key Constraints**: [Technical, business, resource constraints]
- **Critical Success Factors**: [What must go right]
- **Risk Factors**: [What could go wrong]

## Solution Options

### Option 1: [Descriptive Name] ⭐ RECOMMENDED
**Description**: [Brief overview in 2-3 sentences]

**Pros**:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Cons**:
- [Limitation 1]
- [Limitation 2]

**Implementation Approach**:
1. [Phase 1: Foundation]
2. [Phase 2: Core Implementation]
3. [Phase 3: Optimization]

**Risk Assessment**: [Low/Medium/High] - [Brief explanation]
**Estimated Effort**: [Time estimate]
**Success Metrics**: [How to measure success]

### Option 2: [Descriptive Name]
[Similar structure]

### Option 3: [Descriptive Name]
[Similar structure]

## Final Recommendation

**Recommended Approach**: [Option X] or [Hybrid of Options X+Y]

**Rationale**:
- [Key reason 1]
- [Key reason 2]
- [Key reason 3]

**Implementation Roadmap**:
1. **Week 1-2**: [Quick wins, foundation]
2. **Week 3-4**: [Core implementation]
3. **Week 5-6**: [Testing, refinement]
4. **Week 7+**: [Optimization, scaling]

**Success Metrics**:
- [Metric 1]: Target value
- [Metric 2]: Target value
- [Metric 3]: Target value

**Risk Mitigation Plan**:
- **Risk 1**: [Mitigation strategy]
- **Risk 2**: [Mitigation strategy]

**Rollback Strategy**: [How to revert if things go wrong]

## Alternative Perspectives

**Contrarian View**: [What if we did the opposite?]
**Future Considerations**: [What to watch for in 6-12 months]
**Areas for Further Research**: [Unknowns to investigate]

### 10. Meta-Analysis
Reflect on the thinking process itself:

**Process Reflection**:
- Strengths of this analysis
- Areas of uncertainty or missing information
- Acknowledged biases or limitations
- Alternative frameworks that could apply

**Confidence Levels**:
- Problem Understanding: [High/Medium/Low]
- Solution Viability: [High/Medium/Low]
- Risk Assessment: [High/Medium/Low]
- Timeline Estimates: [High/Medium/Low]

**Recommended Next Steps**:
1. [Immediate action]
2. [Short-term action]
3. [Long-term action]

## Output Expectations

When Ultra-Think mode is active, expect:

- **Comprehensive Analysis**: 2-4 pages of detailed insights
- **Multiple Viable Solutions**: At least 3 options with trade-offs
- **Clear Reasoning Chains**: Transparent logic from problem to solution
- **Uncertainty Acknowledgment**: Honest about what we don't know
- **Actionable Recommendations**: Specific next steps with priorities
- **Visual Aids**: Decision matrices, comparison tables when helpful

## Example Triggers

These phrases will activate Ultra-Think mode:

```
"Deep Analysis: Should we migrate from WebForms to Blazor?"
"System Design: Design a scalable order processing system"
"Migration Strategy: Move from monolith to microservices"
"Architectural Decision: Choose between SQL Server and Oracle"
"Strategic Planning: Modernize our legacy codebase"
```

## Integration with ASP.NET WebForms Context

When analyzing WebForms-specific scenarios, Ultra-Think considers:

**Technical Factors**:
- ViewState management and performance
- Postback architecture implications
- Session state strategies
- Page lifecycle complexities

**Security Factors**:
- SQL Injection prevention patterns
- XSS protection mechanisms
- CSRF token implementation
- Input validation strategies

**Modernization Factors**:
- Migration paths to modern frameworks
- Incremental refactoring strategies
- Hybrid architecture options
- Team capability constraints
