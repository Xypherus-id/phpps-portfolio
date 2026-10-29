/**
 * Scan.gs
 * PLACEHOLDER SAFETY SCAN. This is a simple keyword check for the prototype only.
 * It will miss many concerns and flag some harmless answers. A real deployment needs
 * a properly designed process agreed with the school's counselling and safeguarding staff.
 *
 * Rules (decision 9 in CLAUDE.md):
 * - Answers to prompts not marked sensitive get "Not needed".
 * - Answers to sensitive prompts get "Flagged" if any keyword matches, otherwise "Cleared".
 * - A Flagged answer stays Flagged until the Year Head or School Leader clears it.
 */

var Scan = (function () {
  var KEYWORDS = [
    'bully', 'bullied', 'bullying', 'tease', 'teased', 'teasing', 'push', 'pushed', 'pushing',
    'hit', 'hits', 'hitting', 'beat', 'hurt', 'hurts', 'pain', 'scared', 'afraid', 'frightened',
    'cry', 'cried', 'crying', 'alone', 'lonely', 'sad', 'unhappy', 'die', 'dead', 'kill',
    'cut myself', 'hate myself', 'nobody likes', 'no one likes', 'mean things', 'touch me', 'touched me',
    'run away', 'not safe', 'quarrel', 'quarrelling', 'fight', 'fighting', 'threat', 'threaten'
  ];
  var PATTERN = new RegExp('\\b(' + KEYWORDS.map(function (k) { return k.replace(/ /g, '\\s+'); }).join('|') + ')\\b', 'i');

  /** True if the text contains any keyword. */
  function matches(text) {
    return PATTERN.test(String(text || ''));
  }

  /** The scan_status to store for an answer to this prompt. */
  function statusFor(prompt, text, previousStatus) {
    if (prompt.sensitive !== 'Yes') return 'Not needed';
    if (previousStatus === 'Flagged') return 'Flagged';
    return matches(text) ? 'Flagged' : 'Cleared';
  }

  return { matches: matches, statusFor: statusFor, IS_PLACEHOLDER: true };
})();
