interface Array<T> {
  /**
     * Returns the item located at the specified index.
     * @param index The zero-based index of the desired code unit. A negative index will count back from the last item.
     */
  at(index: number): T|undefined;
  diffSig(oneSig: number): T|undefined;
}

interface ReadonlyArray<T> {
  /**
     * Returns the item located at the specified index.
     * @param index The zero-based index of the desired code unit. A negative index will count back from the last item.
     */
  at(index: number): T|undefined;
  diffSig(twoSig: number): T|undefined;
}
