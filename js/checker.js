/*
 * Answer checker. Pure functions, no DOM.
 * Works as a browser global (window.Checker) and as a CommonJS module for tests.
 */
(function (root) {
  'use strict';

  // Trim and collapse runs of whitespace to a single space.
  function normalize(text) {
    return String(text == null ? '' : text).trim().replace(/\s+/g, ' ');
  }

  // Windows answers are case-insensitive; Linux and macOS are case-sensitive.
  function isCaseSensitive(os) {
    return os !== 'windows';
  }

  function tokens(text) {
    const t = normalize(text);
    return t ? t.split(' ') : [];
  }

  function same(a, b, caseSensitive) {
    return caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();
  }

  /*
   * The leading part of an answer that names the command being drilled, as tokens.
   * It runs up to and including the question's command tag, so "ipconfig /release" -> ["ipconfig"],
   * "net use Z: /delete" -> ["net", "use"], and where the tag is the point of the question the
   * whole answer is the core: "chkdsk /?" (tag "/?"), "cat /etc/hosts" (tag "/etc/hosts").
   * Answers that spell the command differently (mkdir for md, rd for rmdir) fall back to the
   * same number of tokens as the tag.
   */
  function coreOf(answer, question) {
    const t = tokens(answer);
    const tag = tokens(question.command);
    const cs = isCaseSensitive(question.os);
    for (let i = 0; i + tag.length <= t.length; i++) {
      if (tag.every((x, j) => same(t[i + j], x, cs))) return t.slice(0, i + tag.length);
    }
    const start = t[0] === 'sudo' && t.length > 1 ? 1 : 0;
    return t.slice(0, start + tag.length);
  }

  // sudo is optional when judging the command, unless sudo is what's being drilled.
  function dropSudo(t, question) {
    return question.command !== 'sudo' && t[0] === 'sudo' && t.length > 1 ? t.slice(1) : t;
  }

  // The accepted answer whose command core starts the typed input, or null.
  function commandMatch(typed, question, caseSensitive) {
    const tt = dropSudo(tokens(typed), question);
    return question.answers.find((a) => {
      const core = dropSudo(coreOf(a, question), question);
      return core.length > 0 && core.length <= tt.length && core.every((x, j) => same(tt[j], x, caseSensitive));
    }) || null;
  }

  /*
   * Check typed input against a question's accepted answers.
   * Returns { status, matched }:
   *   'correct' - the whole answer matches an accepted answer under the OS's case rule
   *   'command' - the right command, but not the whole answer (partial credit)
   *   'case'    - Linux/macOS only: right answer or command, wrong capitalization
   *   'empty'   - nothing typed
   *   'wrong'   - anything else
   * matched is the accepted answer that was (nearly) matched.
   */
  function check(input, question) {
    const typed = normalize(input);
    if (!typed) return { status: 'empty', matched: null };

    const answers = question.answers.map(normalize);
    const cs = isCaseSensitive(question.os);

    const full = answers.find((a) => same(typed, a, cs));
    if (full) return { status: 'correct', matched: full };

    // A whole answer that is only wrong in capitalization is a case lesson, not partial credit.
    const nearFull = cs && answers.find((a) => same(typed, a, false));
    if (nearFull) return { status: 'case', matched: nearFull };

    const cmd = commandMatch(typed, question, cs);
    if (cmd) return { status: 'command', matched: normalize(cmd) };

    const nearCmd = cs && commandMatch(typed, question, false);
    if (nearCmd) return { status: 'case', matched: normalize(nearCmd) };

    return { status: 'wrong', matched: null };
  }

  // First word of the input, used to pick a realistic error message.
  function commandName(input) {
    return normalize(input).split(' ')[0] || '';
  }

  const api = { normalize, isCaseSensitive, check, coreOf, commandName };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Checker = api;
})(typeof window !== 'undefined' ? window : globalThis);
