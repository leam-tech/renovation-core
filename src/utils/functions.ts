/**
 * Sleeps and returns a promise
 * @param t Time to wait in milliseconds
 *
 * @returns {Promise<null>} An empty promise for awaiting a process
 */
export async function asyncSleep(t: number): Promise<null> {
  if (t < 0) {
    t = 0;
  }
  return new Promise(resolve => {
    setTimeout(resolve, t);
  });
}
