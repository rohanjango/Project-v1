/* Meet 2 — Step 7 mock roadmap generator
 * TEMPORARY: this stands in for the future /api/generate-roadmap response.
 */
function mockGenerateRoadmap(profile) {
  const role = profile?.goal?.targetRole || 'Career Explorer';
  const stream = profile?.past?.stream || 'mixed';
  const interests = profile?.present?.interests || [];
  const skills = profile?.skills || {};
  const skillValues = Object.values(skills).filter(v => typeof v === 'number');
  const avg = skillValues.reduce((a, b) => a + b, 0) / Math.max(1, skillValues.length);
  const math = Number(skills['Mathematics'] || 0);
  const python = Number(skills['Python / Programming'] || 0);
  const problem = Number(skills['Problem Solving'] || 0);
  const traditionalScore = Math.min(96, 75 + (profile?.future?.degree?.includes('B.Tech') ? 10 : 0) + math * 2);
  const researchScore = Math.min(97, 70 + math * 4 + (interests.includes('Research') ? 7 : 0));
  const builderScore = Math.min(98, 72 + python * 3 + problem * 2);
  const costBase = Math.max(35, Math.min(100, 82 - math * 3));
  const speedBase = Math.max(30, Math.min(95, 48 + python * 6 + problem * 3));
  const autonomyBase = Math.max(25, Math.min(95, 50 + problem * 5 + (interests.includes('Building Things') ? 10 : 0)));
  const researchBase = Math.max(35, Math.min(100, 58 + math * 7 + (interests.includes('Research') ? 10 : 0)));

  const comparisonPaths = [
    { id: 'traditional', cost: { label: '₹12.0L – 22.0L', score: costBase }, speed: { label: '36 – 40 Mos', score: 85 }, math: { label: 'Applied', score: Math.min(95, 52 + math * 6) }, autonomy: { label: 'Low', description: 'Attendance required', score: 30 } },
    { id: 'research', cost: { label: '₹2.5L – 5.0L', score: Math.max(20, costBase - 45) }, speed: { label: '24 – 30 Mos', score: 62 }, math: { label: 'Rigorous', score: researchBase }, autonomy: { label: 'Moderate', description: 'Lab / research structure', score: 55 } },
    { id: 'builder', cost: { label: '₹1.5L – 3.5L', score: Math.max(15, costBase - 60) }, speed: { label: '12 – 16 Mos', score: Math.min(92, speedBase) }, math: { label: 'Pragmatic', score: Math.max(35, 72 - math * 5) }, autonomy: { label: 'High', description: 'Mostly self-directed', score: Math.min(96, autonomyBase) } }
  ];

  const comparisonById = Object.fromEntries(comparisonPaths.map(item => [item.id, item]));
  const synthesis = {
    title: 'Trade-offs are personal, not absolute',
    summary: `For a ${role} target, the three routes trade institutional structure, analytical depth, speed, cost, and autonomy differently.`,
    details: `Your current profile combines ${stream} background with ${interests.slice(0, 2).join(' + ') || 'broad exploration'} interests and an average skill confidence of ${avg.toFixed(1)}/5. Use the matrix to compare the dimensions that matter to you before selecting a route.`
  };

  return {
    generatedBy: 'mock',
    targetRole: role,
    paths: [
      {
        id: 'traditional', name: 'The Traditional Route', code: 'STRUCTURED', degreeLabel: 'DEGREE: B.TECH',
        summary: 'High credentialing, institutional alumni leverage, and an established campus hiring funnel.', fitScore: traditionalScore,
        fitLabel: `${stream} Match`, fitExplanation: `A structured route that preserves formal degree progression toward ${role}.`,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXplmtUtO_y7v2IGYQ6ceoj1y__iXs1MwH9EV9DCJqbJF3oksLI50qlPOW2t3Eo6qtoX5h7GtRTkpRzOQVBbqPL1ftWW1KMW_GYJIbootrXfbn6VuUuP54rIcFYS_LFDv25V5QZkC0shURDf3NpQy5VO4D02xyATUaX9yJOU0nSQOSwPAav4mlIowmmMMnhtEz4KZCYQiV43I2wzyEYyTImoC63pZPJxFOYsJDCG8FZl_gN7EO6FB6',
        imageAlt: 'Modern engineering university robotics laboratory.', environment: 'Tier 1 & 2 Universities', duration: '48 Months', criteria: ['network', 'math'],
        milestones: [
          { title: 'B.Tech Core', detail: 'Programming, data structures and mathematical foundations' },
          { title: 'Specialization Core', detail: 'ML, systems or domain electives aligned to the target' },
          { title: 'University Project', detail: 'End-to-end capstone proving applied ability' },
          { title: 'Campus Internship', detail: 'Targeted internship in the selected role family' }
        ],
        advantages: ['Structured campus recruiting', 'Formal credential and peer network'], tradeoffs: ['Longer degree commitment', 'Higher institutional cost']
      },
      {
        id: 'research', name: 'The Research & Math Route', code: 'THEORY FIRST', degreeLabel: 'DEGREE: B.SC MATH / STATS',
        summary: 'Theoretical rigor, mathematical depth, and deep algorithmic problem-solving.', fitScore: researchScore,
        fitLabel: 'Analytical Match', fitExplanation: `A depth-first route for quantitative exploration toward ${role}.`,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvqy5oTKsD9jDUmcsFpNKC_xJHJXLQUs4tUOQIHEu_x9cNm5TF1UQL23srQpAMU8wGGoh6qlKJjRFyWDo-MIvK8E71nqXdAWLTMTvbj8vuvkX3kKPOI3ZP85G1xI6LoYcnq14JqqjAo8amjr3WMgVDizE6F6prEdY0vggx7CNFXaxBS5nevnUwtE0OpmYjaBqfZfIpkewgMPJIhkPOWhoIN42c2NhUicFqzHcCn6ibe58lJcSXvoPt',
        imageAlt: 'Students and mathematics research environment.', environment: 'Premier Science Institutes', duration: '3 Yrs + Fast-Track', criteria: ['math'],
        milestones: [
          { title: 'Mathematical Foundation', detail: 'Calculus, linear algebra and probability' },
          { title: 'Computational Statistics', detail: 'Python, statistics, optimization and interpretation' },
          { title: 'Research Assistantship', detail: 'Research exposure through labs, projects or papers' },
          { title: 'Industry / Research Role', detail: 'Transition into applied research or engineering' }
        ],
        advantages: ['Deep analytical foundation', 'Strong research optionality'], tradeoffs: ['More theory-heavy', 'More self-directed software depth needed']
      },
      {
        id: 'builder', name: 'The Skill-First & Builder Route', code: 'BUILDER + OSS', degreeLabel: 'DEGREE: FLEX / ONLINE',
        summary: 'Fast-paced execution focused on proving skills through projects and open source.', fitScore: builderScore,
        fitLabel: 'Builder Aptitude', fitExplanation: `A practical route emphasizing portfolio proof toward ${role}.`,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg4OwFoNJQYWqroqaIWtziAQxqd6UVrc4wfoBFgqPZYERZ_izMFP40N24EPWLvrV39z3VJqwwsoQfP57nyZhOO7d-3m1515RxCTxQ5FnyqOTHkPAEk1DY4cbeTZ4yDySoDxpqAiO617WEAuPHnUMN9oackgCtyGf8-7Iq-sv6cVs_-j9z2kyPnm6MIMcz9qX9vsra5Ku4dg7AACLWnJ-x6A4LAv2ArH856icXb-_71b2TNWGUkqO86',
        imageAlt: 'Students collaborating on software projects.', environment: 'High Growth Startups', duration: '2.5 – 3 Years', criteria: ['speed', 'cost'],
        milestones: [
          { title: 'Flexible Degree + Python Depth', detail: 'Build core programming capability alongside formal study' },
          { title: 'Open Source Contributions', detail: 'Use real repositories to demonstrate engineering behavior' },
          { title: 'Production Multi-Agent Build', detail: 'Ship a public project with measurable usage or tests' },
          { title: 'Direct Internship Sprint', detail: 'Use the portfolio to target practical internships' }
        ],
        advantages: ['Lower upfront cost', 'Fast practical portfolio building'], tradeoffs: ['Requires strong self-discipline', 'Less institutional structure']
      }
    ],
    comparison: {
      metrics: {
        tuition: comparisonPaths.map(item => ({ ...item, value: item.cost.label, score: item.cost.score })),
        speed: comparisonPaths.map(item => ({ ...item, value: item.speed.label, score: item.speed.score })),
        mathematics: comparisonPaths.map(item => ({ ...item, value: `${item.math.label} (${item.math.score}/100)`, score: item.math.score })),
        autonomy: comparisonPaths.map(item => ({ ...item, value: `${item.autonomy.label} (${item.autonomy.description})`, score: item.autonomy.score }))
      },
      legend: comparisonPaths.map(item => ({ id: item.id, name: pathsNamePlaceholder(item.id) })),
      synthesis
    }
  };
}

function pathsNamePlaceholder(id) {
  const names = { traditional: 'Traditional', research: 'Research', builder: 'Skill-First' };
  return names[id] || id;
}

