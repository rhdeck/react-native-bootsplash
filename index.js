import { NativeModules } from "react-native";
const hide = (config = {}) => {
  const { RNBootSplash } = NativeModules;
  RNBootSplash.hide({ duration: 0, ...config }.duration);
};
const show = (config = {}) => {
  const { RNBootSplash } = NativeModules;
  RNBootSplash.show({ duration: 0, ...config }.duration);
};
export default {
  hide,
  show,
};
export { hide, show };
