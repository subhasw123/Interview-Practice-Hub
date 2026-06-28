const DOMAINS = [
  { slug: 'python', name: 'Python', icon: '🐍', desc: 'Core language, OOP, async, std lib.', questions: 50, duration: 60 },
  { slug: 'java', name: 'Java', icon: '☕', desc: 'OOP, collections, concurrency, JVM.', questions: 50, duration: 60 },
  { slug: 'dsa', name: 'DSA', icon: '🧠', desc: 'Arrays, trees, graphs, DP, complexity.', questions: 50, duration: 60 },
  { slug: 'sql', name: 'SQL', icon: '🗄️', desc: 'Joins, indexes, transactions, tuning.', questions: 50, duration: 60 },
  { slug: 'ml', name: 'Machine Learning', icon: '🤖', desc: 'Models, metrics, regularization.', questions: 50, duration: 60 },
  { slug: 'dl', name: 'Deep Learning', icon: '🧬', desc: 'CNNs, RNNs, transformers, training.', questions: 50, duration: 60 },
  { slug: 'mern', name: 'MERN Stack', icon: '⚛️', desc: 'Mongo, Express, React, Node.', questions: 50, duration: 60 },
  { slug: 'dbms', name: 'DBMS', icon: '📚', desc: 'Normalization, ACID, indexing.', questions: 50, duration: 60 },
  { slug: 'genai', name: 'Gen AI', icon: '✨', desc: 'LLMs, prompting, RAG, agents & more.', questions: 50, duration: 60 },
];

function getDomain(slug) {
  return DOMAINS.find(d => d.slug.toLowerCase() === String(slug).toLowerCase());
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

async function loadQuestions(slug) {
  const response = await fetch(`/api/questions?slug=${encodeURIComponent(slug)}`);

  if (!response.ok) {
    throw new Error(`Could not load questions for ${slug}`);
  }

  return await response.json();
}