export class ObjectManipulator {
  /**
   * Safely deletes a property from an object if it exists.
   * Logs a warning if the property does not exist on the object.
   *
   * @template T - The type of the object.
   * @template K - The type of the key, constrained to the keys of the object.
   * @param {T} obj - The object from which the property should be deleted.
   * @param {K} key - The key of the property to delete from the object.
   * @returns {void}
   */
  static safeDelete<T extends object, K extends keyof T>(obj: T, key: K): void {
    if (!(key in obj)) {
      console.warn(`Property ${String(key)} does not exist on the object.`);
      return;
    }

    delete obj[key];
  }

  /**
   * Excludes specified keys from an object and returns a new object with the remaining properties.
   *
   * @template T - The type of the object.
   * @template K - The type of the keys to be excluded, constrained to the keys of the object.
   * @param {T} obj - The object from which to exclude properties.
   * @param {K[]} keys - An array of keys to exclude from the object.
   * @returns {Partial<T>} A new object with the specified keys excluded.
   */
  static exclude<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<T> {
    return Object.keys(obj).reduce((acc, key) => {
      if (!keys.includes(key as K)) {
        acc[key] = obj[key];
      }

      return acc;
    }, {} as Partial<T>);
  }
}
