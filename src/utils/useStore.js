import store from "@/store";
import { computed } from "@vue/composition-api";

export function useState() {
  const withNamespace = arguments.length === 2;
  const name = withNamespace ? arguments[1] : arguments[0];
  const state = withNamespace ? store.state[arguments[0]] : store.state;
  return computed(() => state[name]);
}
export function useGetter() {
  const withNamespace = arguments.length === 2;
  const name = withNamespace ? arguments[0] + "/" + arguments[1] : arguments[0];
  // const moduleName = module ? module + "/" : "";
  return computed(() => store.getters[name]);
}

export function useMutation() {
  const withNamespace = arguments.length === 2;
  const name = withNamespace ? arguments[0] + "/" + arguments[1] : arguments[0];
  return payload => {
    store.commit(name, payload);
  };
}

export function useAction() {
  const withNamespace = arguments.length === 2;
  const name = withNamespace ? arguments[0] + "/" + arguments[1] : arguments[0];
  return payload => {
    return store.dispatch(name, payload);
  };
}
