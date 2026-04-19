const { hex } = require('wcag-contrast');

const PAIRS = [
  ['#1A202B', '#F4F6F8', 7,   'text-primary on canvas'],
  ['#1A202B', '#FFFFFF', 7,   'text-primary on raised'],
  ['#3B4556', '#F4F6F8', 7,   'text-secondary on canvas'],
  ['#4A5567', '#FFFFFF', 7,   'text-muted on white'],
  ['#155E75', '#FFFFFF', 7,   'cyan-700 (accent) on white'],
  ['#065F46', '#FFFFFF', 7,   'gain-700 (fin-gain) on white'],
  ['#065F46', '#ECFDF5', 7,   'gain-700 on gain-50'],
  ['#991B1B', '#FFFFFF', 7,   'loss-700 (fin-loss) on white'],
  ['#991B1B', '#FEF2F2', 7,   'loss-700 on loss-50'],
  ['#92400E', '#FFFFFF', 7,   'warn-700 (ai-low) on white'],
  ['#1E40AF', '#FFFFFF', 7,   'info-700 (ai-moderate) on white'],
  ['#115E59', '#FFFFFF', 7,   'teal-700 (income) on white'],
  ['#5B21B6', '#FFFFFF', 7,   'violet-700 (ai-pattern) on white'],
  ['#3730A3', '#FFFFFF', 7,   'indigo-700 (education) on white'],
  ['#9F1239', '#FFFFFF', 7,   'rose-700 (alert-strong) on white'],
  ['#155E75', '#F4F6F8', 3,   'focus-ring on canvas (non-text)'],
  ['#F5F7FA', '#050810', 7,   'DARK text-primary on canvas'],
  ['#A3AEC3', '#050810', 7,   'DARK text-secondary'],
  ['#8F9DB4', '#050810', 7,   'DARK text-muted'],
  ['#22D3EE', '#050810', 7,   'DARK cyan-400 (focus-ring)'],
  ['#34D399', '#050810', 7,   'DARK gain-400'],
  ['#F87171', '#050810', 7,   'DARK loss-400'],
  ['#2DD4BF', '#050810', 7,   'DARK teal-400 (income)'],
  ['#A78BFA', '#050810', 7,   'DARK violet-400 (ai-pattern)'],
  ['#A5B4FC', '#050810', 7,   'DARK indigo-300 (education)'],
  ['#FB7185', '#050810', 7,   'DARK rose-400 (alert-strong)'],
];

let passed = 0, failed = 0;
for (const [fg, bg, min, label] of PAIRS) {
  const ratio = hex(fg, bg);
  const ok = ratio >= min;
  const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'FAIL';
  const icon = ok ? '\u2705' : '\u274C';
  console.log(icon + ' ' + ratio.toFixed(2) + ':1 (' + grade + ') [min ' + min + ':1] -- ' + label);
  if (ok) passed++; else failed++;
}

console.log('\n' + passed + '/' + (passed + failed) + ' pairs pass.');
process.exit(failed > 0 ? 1 : 0);
