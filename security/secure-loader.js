(function () {
  const src = document.currentScript.src;
  const u = new URL(src);
  const tok = u.searchParams.get("tok");
  if (!tok) {
    document.body.textContent = "NO TOKEN";
    return;
  }
  async function collectFingerprint() {
    const hashCanvas = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 200;
        c.height = 50;
        const ctx = c.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 200, 0);
        gradient.addColorStop(0, "#f00");
        gradient.addColorStop(1, "#00f");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText(navigator.userAgent, 10, 30);
        const data = c.toDataURL();
        // simple checksum
        let hash = 0;
        for (let i = 0; i < data.length; i++)
          hash = (hash << 5) - hash + data.charCodeAt(i);
        return hash >>> 0;
      } catch (e) {
        return 0;
      }
    };

    // GPU renderer
    let gpu = "";
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (gl) {
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "";
      }
    } catch {}

    const coarse = matchMedia("(pointer: coarse)").matches;
    const hover = matchMedia("(hover: hover)").matches;

    return {
      ua: navigator.userAgent,
      platform: navigator.platform,
      mem: navigator.deviceMemory || 0,
      cpu: navigator.hardwareConcurrency || 0,
      mp: navigator.maxTouchPoints,
      coarse,
      hover,
      gpu,
      net:
        (navigator.connection &&
          (navigator.connection.effectiveType || navigator.connection.type)) ||
        "",
      width: screen.width,
      height: screen.height,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: navigator.language,
      canvas: hashCanvas(),
      dev: false,
    };
  }
  function detectDev() {
    const ua = navigator.userAgent.toLowerCase();
    const isiOS =
      ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod");
    const isMobile = ua.includes("android") || isiOS;
    const hasTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    const isRealMobileDevice =
      hasTouch && Math.max(screen.width, screen.height) < 900;

    if (window.__IS_DEVTOOLS_OPEN__) return true;

    {
      const t0 = performance.now();
      debugger;
      if (performance.now() - t0 > 200) return true;
    }

    return false;
  }
  function report(type) {
    if (sessionStorage.devReported) return;
    sessionStorage.devReported = 1;
    fetch("/report-dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tok, type, ua: navigator.userAgent }),
    });
  }
  const firstDev = detectDev();
  if (firstDev) {
    report("early");
    location.reload();
    return;
  }
  document.cookie = `tpltok=${tok}; path=/secure-asset; max-age=60; SameSite=Strict`;

  collectFingerprint().then((info) => {
    fetch("/secure-template?tok=" + tok, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    }).then(async (r) => {
      if (!r.ok) {
        document.body.textContent = "DENIED";
        return;
      }
      const { html, css, js, folder } = await r.json();

      if (html) {
        const parsed = new DOMParser().parseFromString(html, "text/html");

        const execScript = (srcEl, parent) => {
          const s = document.createElement("script");
          [...srcEl.attributes].forEach((a) => s.setAttribute(a.name, a.value));
          if (!s.src) {
            s.textContent = srcEl.textContent;
          } else {
            if (!/^https?:\/\//.test(s.src) && !s.src.startsWith("/")) {
              const cleanSrc = s.src.replace(/^\.\//, "");
              s.src = `/secure-asset/${folder}/${cleanSrc}?tok=${tok}&v=${Date.now()}`;
            }
            s.async = false;
          }
          parent.appendChild(s);
        };

        [...parsed.head.children].forEach((el) => {
          if (el.tagName.toLowerCase() === "script") {
            execScript(el, document.head);
          } else {
            document.head.appendChild(el.cloneNode(true));
          }
        });

        document.body.innerHTML = parsed.body.innerHTML;

        [...document.body.querySelectorAll("script")].forEach((el) => {
          execScript(el, el.parentNode);
          el.parentNode.removeChild(el);
        });
      }

      if (folder) {
        const styleLinks = [
          ...document.querySelectorAll('link[rel="stylesheet"]'),
        ];
        const secureStyleExists = styleLinks.some((l) => {
          const href = l.getAttribute("href") || "";
          return href.includes("/secure-asset/") && href.includes("style.css");
        });
        if (!secureStyleExists) {
          const relStyle = styleLinks.find((l) => {
            const href = l.getAttribute("href") || "";
            return (
              /(^|\/|)style\.css(\?|$)/.test(href) &&
              !href.includes("/secure-asset/")
            );
          });
          if (relStyle) {
            relStyle.href = `/secure-asset/${folder}/style.css?tok=${tok}&v=${Date.now()}`;
            document.head.removeChild(relStyle);
            document.head.appendChild(relStyle);
            const ensureLinkAfterTailwind = (linkEl) => {
              if (!linkEl) return;
              const reposition = () => {
                const twStyles = [
                  ...document.querySelectorAll(
                    'style[id^="tailwind"],style[id^="__TAILWIND"]'
                  ),
                ];
                if (twStyles.length) {
                  const lastTw = twStyles[twStyles.length - 1];
                  if (lastTw.nextSibling !== linkEl) {
                    lastTw.parentNode.insertBefore(linkEl, lastTw.nextSibling);
                  }
                }
              };
              reposition();
              const obs = new MutationObserver((muts) => {
                if (
                  muts.some((m) =>
                    [...m.addedNodes].some(
                      (n) =>
                        n.nodeType === 1 &&
                        n.tagName === "STYLE" &&
                        (n.id.startsWith("tailwind") ||
                          n.id.startsWith("__TAILWIND"))
                    )
                  )
                ) {
                  reposition();
                }
              });
              obs.observe(document.head, { childList: true });
              setTimeout(() => obs.disconnect(), 5000);
            };
            ensureLinkAfterTailwind(relStyle);
          } else {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `/secure-asset/${folder}/style.css?tok=${tok}&v=${Date.now()}`;
            document.head.appendChild(link);
            ensureLinkAfterTailwind(link);
          }
        } else {
          const link = styleLinks.find((l) => {
            const href = l.getAttribute("href") || "";
            return (
              href.includes("/secure-asset/") && href.includes("style.css")
            );
          });
          if (link) {
            ensureLinkAfterTailwind(link);
          }
        }
        const scriptTags = [...document.querySelectorAll("script")];
        const secureScriptExists = scriptTags.some((s) => {
          const srcAttr = s.getAttribute("src") || "";
          return (
            srcAttr.includes("/secure-asset/") && srcAttr.includes("script.js")
          );
        });
        if (!secureScriptExists) {
          const relScript = scriptTags.find((s) => {
            const srcAttr = s.getAttribute("src") || "";
            return (
              /(^|\/|)script(\.obf)?\.js(\?|$)/.test(srcAttr) &&
              !srcAttr.includes("/secure-asset/")
            );
          });
          if (relScript) {
            relScript.async = false;
            relScript.src = `/secure-asset/${folder}/script.js?tok=${tok}&v=${Date.now()}`;
          } else {
            const scriptEl = document.createElement("script");
            scriptEl.src = `/secure-asset/${folder}/script.js?tok=${tok}&v=${Date.now()}`;
            scriptEl.async = false;
            scriptEl.defer = true;
            scriptEl.addEventListener("load", () => {
              if (document.readyState !== "loading") {
                const evt = new Event("DOMContentLoaded", {
                  bubbles: true,
                  cancelable: true,
                });
                document.dispatchEvent(evt);
              }
            });
            document.body.appendChild(scriptEl);
          }
        }
      } else {
        if (css) {
          const st = document.createElement("style");
          st.textContent = css;
          document.head.appendChild(st);
        }
        if (js) eval(js);
      }

      setInterval(() => {
        if (detectDev()) {
          report("late");
          location.reload();
        }
      }, 1000);
    });
  });
})();