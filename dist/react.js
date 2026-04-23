import { jsx as v } from "react/jsx-runtime";
import { useRef as m, useEffect as C } from "react";
import { createBrushingCanvas as x } from "./index.js";
function p({
  dataset: t,
  width: n = 800,
  height: u = 800,
  className: o,
  style: i,
  onReady: c,
  ...r
}) {
  const s = m(null), e = m(null);
  return C(() => {
    var f;
    const l = s.current;
    if (l)
      return (f = e.current) == null || f.destroy(), e.current = x(l, t, {
        ...r,
        width: n,
        height: u
      }), c == null || c(e.current), () => {
        var a;
        (a = e.current) == null || a.destroy(), e.current = null;
      };
  }, [t, n, u, r.implementation, r.technique, r.painterRadius, r.pointSize, r.showGlobalDensity, r.showLocalCloseness]), /* @__PURE__ */ v("canvas", { ref: s, width: n, height: u, className: o, style: i });
}
export {
  p as BrushingCanvas
};
