export default interface IBindTargetInterface {
  doc;

  /** When the Control is hidden due to being Read Only and does'nt have value */
  isReadOnlyHidden: boolean;
  refresh();
}
