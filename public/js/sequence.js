// Note order: new notes come from the selector. A failed note rewinds to the
// previously matched note; matching that returns to the failed note, so the
// interval between them is practiced. While rewinding, wrong notes are not
// failures (see main.js); the player keeps trying the previous note.
export function createSequence(selector) {
  let current = null;
  let previous = null;
  let returnTo = null;
  return {
    get rewinding() {
      return returnTo != null;
    },
    start() {
      previous = returnTo = null;
      return (current = selector.next());
    },
    matched() {
      previous = current;
      if (returnTo != null) {
        current = returnTo;
        returnTo = null;
      } else {
        current = selector.next();
      }
      return current;
    },
    failed() {
      if (returnTo == null && previous != null) {
        returnTo = current;
        current = previous;
      }
      return current;
    },
  };
}
