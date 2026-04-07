(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function n(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(i){if(i.ep)return;i.ep=!0;const s=n(i);fetch(i.href,s)}})();function ZT(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var Dy={exports:{}},ae={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Wo=Symbol.for("react.element"),e0=Symbol.for("react.portal"),t0=Symbol.for("react.fragment"),n0=Symbol.for("react.strict_mode"),r0=Symbol.for("react.profiler"),i0=Symbol.for("react.provider"),s0=Symbol.for("react.context"),o0=Symbol.for("react.forward_ref"),a0=Symbol.for("react.suspense"),l0=Symbol.for("react.memo"),u0=Symbol.for("react.lazy"),Gp=Symbol.iterator;function c0(t){return t===null||typeof t!="object"?null:(t=Gp&&t[Gp]||t["@@iterator"],typeof t=="function"?t:null)}var Vy={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Oy=Object.assign,Ly={};function ls(t,e,n){this.props=t,this.context=e,this.refs=Ly,this.updater=n||Vy}ls.prototype.isReactComponent={};ls.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")};ls.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function My(){}My.prototype=ls.prototype;function ad(t,e,n){this.props=t,this.context=e,this.refs=Ly,this.updater=n||Vy}var ld=ad.prototype=new My;ld.constructor=ad;Oy(ld,ls.prototype);ld.isPureReactComponent=!0;var Kp=Array.isArray,Fy=Object.prototype.hasOwnProperty,ud={current:null},Uy={key:!0,ref:!0,__self:!0,__source:!0};function zy(t,e,n){var r,i={},s=null,o=null;if(e!=null)for(r in e.ref!==void 0&&(o=e.ref),e.key!==void 0&&(s=""+e.key),e)Fy.call(e,r)&&!Uy.hasOwnProperty(r)&&(i[r]=e[r]);var l=arguments.length-2;if(l===1)i.children=n;else if(1<l){for(var u=Array(l),h=0;h<l;h++)u[h]=arguments[h+2];i.children=u}if(t&&t.defaultProps)for(r in l=t.defaultProps,l)i[r]===void 0&&(i[r]=l[r]);return{$$typeof:Wo,type:t,key:s,ref:o,props:i,_owner:ud.current}}function h0(t,e){return{$$typeof:Wo,type:t.type,key:e,ref:t.ref,props:t.props,_owner:t._owner}}function cd(t){return typeof t=="object"&&t!==null&&t.$$typeof===Wo}function d0(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(n){return e[n]})}var Qp=/\/+/g;function ac(t,e){return typeof t=="object"&&t!==null&&t.key!=null?d0(""+t.key):e.toString(36)}function qa(t,e,n,r,i){var s=typeof t;(s==="undefined"||s==="boolean")&&(t=null);var o=!1;if(t===null)o=!0;else switch(s){case"string":case"number":o=!0;break;case"object":switch(t.$$typeof){case Wo:case e0:o=!0}}if(o)return o=t,i=i(o),t=r===""?"."+ac(o,0):r,Kp(i)?(n="",t!=null&&(n=t.replace(Qp,"$&/")+"/"),qa(i,e,n,"",function(h){return h})):i!=null&&(cd(i)&&(i=h0(i,n+(!i.key||o&&o.key===i.key?"":(""+i.key).replace(Qp,"$&/")+"/")+t)),e.push(i)),1;if(o=0,r=r===""?".":r+":",Kp(t))for(var l=0;l<t.length;l++){s=t[l];var u=r+ac(s,l);o+=qa(s,e,n,u,i)}else if(u=c0(t),typeof u=="function")for(t=u.call(t),l=0;!(s=t.next()).done;)s=s.value,u=r+ac(s,l++),o+=qa(s,e,n,u,i);else if(s==="object")throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.");return o}function wa(t,e,n){if(t==null)return t;var r=[],i=0;return qa(t,r,"","",function(s){return e.call(n,s,i++)}),r}function f0(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(n){(t._status===0||t._status===-1)&&(t._status=1,t._result=n)},function(n){(t._status===0||t._status===-1)&&(t._status=2,t._result=n)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var gt={current:null},Ga={transition:null},p0={ReactCurrentDispatcher:gt,ReactCurrentBatchConfig:Ga,ReactCurrentOwner:ud};function By(){throw Error("act(...) is not supported in production builds of React.")}ae.Children={map:wa,forEach:function(t,e,n){wa(t,function(){e.apply(this,arguments)},n)},count:function(t){var e=0;return wa(t,function(){e++}),e},toArray:function(t){return wa(t,function(e){return e})||[]},only:function(t){if(!cd(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};ae.Component=ls;ae.Fragment=t0;ae.Profiler=r0;ae.PureComponent=ad;ae.StrictMode=n0;ae.Suspense=a0;ae.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=p0;ae.act=By;ae.cloneElement=function(t,e,n){if(t==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+t+".");var r=Oy({},t.props),i=t.key,s=t.ref,o=t._owner;if(e!=null){if(e.ref!==void 0&&(s=e.ref,o=ud.current),e.key!==void 0&&(i=""+e.key),t.type&&t.type.defaultProps)var l=t.type.defaultProps;for(u in e)Fy.call(e,u)&&!Uy.hasOwnProperty(u)&&(r[u]=e[u]===void 0&&l!==void 0?l[u]:e[u])}var u=arguments.length-2;if(u===1)r.children=n;else if(1<u){l=Array(u);for(var h=0;h<u;h++)l[h]=arguments[h+2];r.children=l}return{$$typeof:Wo,type:t.type,key:i,ref:s,props:r,_owner:o}};ae.createContext=function(t){return t={$$typeof:s0,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},t.Provider={$$typeof:i0,_context:t},t.Consumer=t};ae.createElement=zy;ae.createFactory=function(t){var e=zy.bind(null,t);return e.type=t,e};ae.createRef=function(){return{current:null}};ae.forwardRef=function(t){return{$$typeof:o0,render:t}};ae.isValidElement=cd;ae.lazy=function(t){return{$$typeof:u0,_payload:{_status:-1,_result:t},_init:f0}};ae.memo=function(t,e){return{$$typeof:l0,type:t,compare:e===void 0?null:e}};ae.startTransition=function(t){var e=Ga.transition;Ga.transition={};try{t()}finally{Ga.transition=e}};ae.unstable_act=By;ae.useCallback=function(t,e){return gt.current.useCallback(t,e)};ae.useContext=function(t){return gt.current.useContext(t)};ae.useDebugValue=function(){};ae.useDeferredValue=function(t){return gt.current.useDeferredValue(t)};ae.useEffect=function(t,e){return gt.current.useEffect(t,e)};ae.useId=function(){return gt.current.useId()};ae.useImperativeHandle=function(t,e,n){return gt.current.useImperativeHandle(t,e,n)};ae.useInsertionEffect=function(t,e){return gt.current.useInsertionEffect(t,e)};ae.useLayoutEffect=function(t,e){return gt.current.useLayoutEffect(t,e)};ae.useMemo=function(t,e){return gt.current.useMemo(t,e)};ae.useReducer=function(t,e,n){return gt.current.useReducer(t,e,n)};ae.useRef=function(t){return gt.current.useRef(t)};ae.useState=function(t){return gt.current.useState(t)};ae.useSyncExternalStore=function(t,e,n){return gt.current.useSyncExternalStore(t,e,n)};ae.useTransition=function(){return gt.current.useTransition()};ae.version="18.3.1";Dy.exports=ae;var J=Dy.exports;const f=ZT(J);var jy={exports:{}},bt={},$y={exports:{}},Wy={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(t){function e(j,Q){var X=j.length;j.push(Q);e:for(;0<X;){var z=X-1>>>1,W=j[z];if(0<i(W,Q))j[z]=Q,j[X]=W,X=z;else break e}}function n(j){return j.length===0?null:j[0]}function r(j){if(j.length===0)return null;var Q=j[0],X=j.pop();if(X!==Q){j[0]=X;e:for(var z=0,W=j.length,Se=W>>>1;z<Se;){var tt=2*(z+1)-1,ht=j[tt],ve=tt+1,vt=j[ve];if(0>i(ht,X))ve<W&&0>i(vt,ht)?(j[z]=vt,j[ve]=X,z=ve):(j[z]=ht,j[tt]=X,z=tt);else if(ve<W&&0>i(vt,X))j[z]=vt,j[ve]=X,z=ve;else break e}}return Q}function i(j,Q){var X=j.sortIndex-Q.sortIndex;return X!==0?X:j.id-Q.id}if(typeof performance=="object"&&typeof performance.now=="function"){var s=performance;t.unstable_now=function(){return s.now()}}else{var o=Date,l=o.now();t.unstable_now=function(){return o.now()-l}}var u=[],h=[],p=1,m=null,g=3,_=!1,N=!1,R=!1,k=typeof setTimeout=="function"?setTimeout:null,I=typeof clearTimeout=="function"?clearTimeout:null,T=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function P(j){for(var Q=n(h);Q!==null;){if(Q.callback===null)r(h);else if(Q.startTime<=j)r(h),Q.sortIndex=Q.expirationTime,e(u,Q);else break;Q=n(h)}}function b(j){if(R=!1,P(j),!N)if(n(u)!==null)N=!0,se(V);else{var Q=n(h);Q!==null&&et(b,Q.startTime-j)}}function V(j,Q){N=!1,R&&(R=!1,I(v),v=-1),_=!0;var X=g;try{for(P(Q),m=n(u);m!==null&&(!(m.expirationTime>Q)||j&&!C());){var z=m.callback;if(typeof z=="function"){m.callback=null,g=m.priorityLevel;var W=z(m.expirationTime<=Q);Q=t.unstable_now(),typeof W=="function"?m.callback=W:m===n(u)&&r(u),P(Q)}else r(u);m=n(u)}if(m!==null)var Se=!0;else{var tt=n(h);tt!==null&&et(b,tt.startTime-Q),Se=!1}return Se}finally{m=null,g=X,_=!1}}var M=!1,w=null,v=-1,E=5,A=-1;function C(){return!(t.unstable_now()-A<E)}function x(){if(w!==null){var j=t.unstable_now();A=j;var Q=!0;try{Q=w(!0,j)}finally{Q?S():(M=!1,w=null)}}else M=!1}var S;if(typeof T=="function")S=function(){T(x)};else if(typeof MessageChannel<"u"){var L=new MessageChannel,q=L.port2;L.port1.onmessage=x,S=function(){q.postMessage(null)}}else S=function(){k(x,0)};function se(j){w=j,M||(M=!0,S())}function et(j,Q){v=k(function(){j(t.unstable_now())},Q)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(j){j.callback=null},t.unstable_continueExecution=function(){N||_||(N=!0,se(V))},t.unstable_forceFrameRate=function(j){0>j||125<j?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):E=0<j?Math.floor(1e3/j):5},t.unstable_getCurrentPriorityLevel=function(){return g},t.unstable_getFirstCallbackNode=function(){return n(u)},t.unstable_next=function(j){switch(g){case 1:case 2:case 3:var Q=3;break;default:Q=g}var X=g;g=Q;try{return j()}finally{g=X}},t.unstable_pauseExecution=function(){},t.unstable_requestPaint=function(){},t.unstable_runWithPriority=function(j,Q){switch(j){case 1:case 2:case 3:case 4:case 5:break;default:j=3}var X=g;g=j;try{return Q()}finally{g=X}},t.unstable_scheduleCallback=function(j,Q,X){var z=t.unstable_now();switch(typeof X=="object"&&X!==null?(X=X.delay,X=typeof X=="number"&&0<X?z+X:z):X=z,j){case 1:var W=-1;break;case 2:W=250;break;case 5:W=1073741823;break;case 4:W=1e4;break;default:W=5e3}return W=X+W,j={id:p++,callback:Q,priorityLevel:j,startTime:X,expirationTime:W,sortIndex:-1},X>z?(j.sortIndex=X,e(h,j),n(u)===null&&j===n(h)&&(R?(I(v),v=-1):R=!0,et(b,X-z))):(j.sortIndex=W,e(u,j),N||_||(N=!0,se(V))),j},t.unstable_shouldYield=C,t.unstable_wrapCallback=function(j){var Q=g;return function(){var X=g;g=Q;try{return j.apply(this,arguments)}finally{g=X}}}})(Wy);$y.exports=Wy;var m0=$y.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var g0=J,xt=m0;function B(t){for(var e="https://reactjs.org/docs/error-decoder.html?invariant="+t,n=1;n<arguments.length;n++)e+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Hy=new Set,yo={};function li(t,e){Gi(t,e),Gi(t+"Capture",e)}function Gi(t,e){for(yo[t]=e,t=0;t<e.length;t++)Hy.add(e[t])}var Pn=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Hc=Object.prototype.hasOwnProperty,y0=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,Yp={},Xp={};function v0(t){return Hc.call(Xp,t)?!0:Hc.call(Yp,t)?!1:y0.test(t)?Xp[t]=!0:(Yp[t]=!0,!1)}function _0(t,e,n,r){if(n!==null&&n.type===0)return!1;switch(typeof e){case"function":case"symbol":return!0;case"boolean":return r?!1:n!==null?!n.acceptsBooleans:(t=t.toLowerCase().slice(0,5),t!=="data-"&&t!=="aria-");default:return!1}}function E0(t,e,n,r){if(e===null||typeof e>"u"||_0(t,e,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!e;case 4:return e===!1;case 5:return isNaN(e);case 6:return isNaN(e)||1>e}return!1}function yt(t,e,n,r,i,s,o){this.acceptsBooleans=e===2||e===3||e===4,this.attributeName=r,this.attributeNamespace=i,this.mustUseProperty=n,this.propertyName=t,this.type=e,this.sanitizeURL=s,this.removeEmptyString=o}var Je={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(t){Je[t]=new yt(t,0,!1,t,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(t){var e=t[0];Je[e]=new yt(e,1,!1,t[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(t){Je[t]=new yt(t,2,!1,t.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(t){Je[t]=new yt(t,2,!1,t,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(t){Je[t]=new yt(t,3,!1,t.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(t){Je[t]=new yt(t,3,!0,t,null,!1,!1)});["capture","download"].forEach(function(t){Je[t]=new yt(t,4,!1,t,null,!1,!1)});["cols","rows","size","span"].forEach(function(t){Je[t]=new yt(t,6,!1,t,null,!1,!1)});["rowSpan","start"].forEach(function(t){Je[t]=new yt(t,5,!1,t.toLowerCase(),null,!1,!1)});var hd=/[\-:]([a-z])/g;function dd(t){return t[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(t){var e=t.replace(hd,dd);Je[e]=new yt(e,1,!1,t,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(t){var e=t.replace(hd,dd);Je[e]=new yt(e,1,!1,t,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(t){var e=t.replace(hd,dd);Je[e]=new yt(e,1,!1,t,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(t){Je[t]=new yt(t,1,!1,t.toLowerCase(),null,!1,!1)});Je.xlinkHref=new yt("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(t){Je[t]=new yt(t,1,!1,t.toLowerCase(),null,!0,!0)});function fd(t,e,n,r){var i=Je.hasOwnProperty(e)?Je[e]:null;(i!==null?i.type!==0:r||!(2<e.length)||e[0]!=="o"&&e[0]!=="O"||e[1]!=="n"&&e[1]!=="N")&&(E0(e,n,i,r)&&(n=null),r||i===null?v0(e)&&(n===null?t.removeAttribute(e):t.setAttribute(e,""+n)):i.mustUseProperty?t[i.propertyName]=n===null?i.type===3?!1:"":n:(e=i.attributeName,r=i.attributeNamespace,n===null?t.removeAttribute(e):(i=i.type,n=i===3||i===4&&n===!0?"":""+n,r?t.setAttributeNS(r,e,n):t.setAttribute(e,n))))}var Mn=g0.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Ta=Symbol.for("react.element"),wi=Symbol.for("react.portal"),Ti=Symbol.for("react.fragment"),pd=Symbol.for("react.strict_mode"),qc=Symbol.for("react.profiler"),qy=Symbol.for("react.provider"),Gy=Symbol.for("react.context"),md=Symbol.for("react.forward_ref"),Gc=Symbol.for("react.suspense"),Kc=Symbol.for("react.suspense_list"),gd=Symbol.for("react.memo"),Qn=Symbol.for("react.lazy"),Ky=Symbol.for("react.offscreen"),Jp=Symbol.iterator;function Ls(t){return t===null||typeof t!="object"?null:(t=Jp&&t[Jp]||t["@@iterator"],typeof t=="function"?t:null)}var ke=Object.assign,lc;function qs(t){if(lc===void 0)try{throw Error()}catch(n){var e=n.stack.trim().match(/\n( *(at )?)/);lc=e&&e[1]||""}return`
`+lc+t}var uc=!1;function cc(t,e){if(!t||uc)return"";uc=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(e)if(e=function(){throw Error()},Object.defineProperty(e.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(e,[])}catch(h){var r=h}Reflect.construct(t,[],e)}else{try{e.call()}catch(h){r=h}t.call(e.prototype)}else{try{throw Error()}catch(h){r=h}t()}}catch(h){if(h&&r&&typeof h.stack=="string"){for(var i=h.stack.split(`
`),s=r.stack.split(`
`),o=i.length-1,l=s.length-1;1<=o&&0<=l&&i[o]!==s[l];)l--;for(;1<=o&&0<=l;o--,l--)if(i[o]!==s[l]){if(o!==1||l!==1)do if(o--,l--,0>l||i[o]!==s[l]){var u=`
`+i[o].replace(" at new "," at ");return t.displayName&&u.includes("<anonymous>")&&(u=u.replace("<anonymous>",t.displayName)),u}while(1<=o&&0<=l);break}}}finally{uc=!1,Error.prepareStackTrace=n}return(t=t?t.displayName||t.name:"")?qs(t):""}function w0(t){switch(t.tag){case 5:return qs(t.type);case 16:return qs("Lazy");case 13:return qs("Suspense");case 19:return qs("SuspenseList");case 0:case 2:case 15:return t=cc(t.type,!1),t;case 11:return t=cc(t.type.render,!1),t;case 1:return t=cc(t.type,!0),t;default:return""}}function Qc(t){if(t==null)return null;if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case Ti:return"Fragment";case wi:return"Portal";case qc:return"Profiler";case pd:return"StrictMode";case Gc:return"Suspense";case Kc:return"SuspenseList"}if(typeof t=="object")switch(t.$$typeof){case Gy:return(t.displayName||"Context")+".Consumer";case qy:return(t._context.displayName||"Context")+".Provider";case md:var e=t.render;return t=t.displayName,t||(t=e.displayName||e.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case gd:return e=t.displayName||null,e!==null?e:Qc(t.type)||"Memo";case Qn:e=t._payload,t=t._init;try{return Qc(t(e))}catch{}}return null}function T0(t){var e=t.type;switch(t.tag){case 24:return"Cache";case 9:return(e.displayName||"Context")+".Consumer";case 10:return(e._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return t=e.render,t=t.displayName||t.name||"",e.displayName||(t!==""?"ForwardRef("+t+")":"ForwardRef");case 7:return"Fragment";case 5:return e;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Qc(e);case 8:return e===pd?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e}return null}function Er(t){switch(typeof t){case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function Qy(t){var e=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(e==="checkbox"||e==="radio")}function I0(t){var e=Qy(t)?"checked":"value",n=Object.getOwnPropertyDescriptor(t.constructor.prototype,e),r=""+t[e];if(!t.hasOwnProperty(e)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var i=n.get,s=n.set;return Object.defineProperty(t,e,{configurable:!0,get:function(){return i.call(this)},set:function(o){r=""+o,s.call(this,o)}}),Object.defineProperty(t,e,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(o){r=""+o},stopTracking:function(){t._valueTracker=null,delete t[e]}}}}function Ia(t){t._valueTracker||(t._valueTracker=I0(t))}function Yy(t){if(!t)return!1;var e=t._valueTracker;if(!e)return!0;var n=e.getValue(),r="";return t&&(r=Qy(t)?t.checked?"true":"false":t.value),t=r,t!==n?(e.setValue(t),!0):!1}function pl(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function Yc(t,e){var n=e.checked;return ke({},e,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??t._wrapperState.initialChecked})}function Zp(t,e){var n=e.defaultValue==null?"":e.defaultValue,r=e.checked!=null?e.checked:e.defaultChecked;n=Er(e.value!=null?e.value:n),t._wrapperState={initialChecked:r,initialValue:n,controlled:e.type==="checkbox"||e.type==="radio"?e.checked!=null:e.value!=null}}function Xy(t,e){e=e.checked,e!=null&&fd(t,"checked",e,!1)}function Xc(t,e){Xy(t,e);var n=Er(e.value),r=e.type;if(n!=null)r==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+n):t.value!==""+n&&(t.value=""+n);else if(r==="submit"||r==="reset"){t.removeAttribute("value");return}e.hasOwnProperty("value")?Jc(t,e.type,n):e.hasOwnProperty("defaultValue")&&Jc(t,e.type,Er(e.defaultValue)),e.checked==null&&e.defaultChecked!=null&&(t.defaultChecked=!!e.defaultChecked)}function em(t,e,n){if(e.hasOwnProperty("value")||e.hasOwnProperty("defaultValue")){var r=e.type;if(!(r!=="submit"&&r!=="reset"||e.value!==void 0&&e.value!==null))return;e=""+t._wrapperState.initialValue,n||e===t.value||(t.value=e),t.defaultValue=e}n=t.name,n!==""&&(t.name=""),t.defaultChecked=!!t._wrapperState.initialChecked,n!==""&&(t.name=n)}function Jc(t,e,n){(e!=="number"||pl(t.ownerDocument)!==t)&&(n==null?t.defaultValue=""+t._wrapperState.initialValue:t.defaultValue!==""+n&&(t.defaultValue=""+n))}var Gs=Array.isArray;function Oi(t,e,n,r){if(t=t.options,e){e={};for(var i=0;i<n.length;i++)e["$"+n[i]]=!0;for(n=0;n<t.length;n++)i=e.hasOwnProperty("$"+t[n].value),t[n].selected!==i&&(t[n].selected=i),i&&r&&(t[n].defaultSelected=!0)}else{for(n=""+Er(n),e=null,i=0;i<t.length;i++){if(t[i].value===n){t[i].selected=!0,r&&(t[i].defaultSelected=!0);return}e!==null||t[i].disabled||(e=t[i])}e!==null&&(e.selected=!0)}}function Zc(t,e){if(e.dangerouslySetInnerHTML!=null)throw Error(B(91));return ke({},e,{value:void 0,defaultValue:void 0,children:""+t._wrapperState.initialValue})}function tm(t,e){var n=e.value;if(n==null){if(n=e.children,e=e.defaultValue,n!=null){if(e!=null)throw Error(B(92));if(Gs(n)){if(1<n.length)throw Error(B(93));n=n[0]}e=n}e==null&&(e=""),n=e}t._wrapperState={initialValue:Er(n)}}function Jy(t,e){var n=Er(e.value),r=Er(e.defaultValue);n!=null&&(n=""+n,n!==t.value&&(t.value=n),e.defaultValue==null&&t.defaultValue!==n&&(t.defaultValue=n)),r!=null&&(t.defaultValue=""+r)}function nm(t){var e=t.textContent;e===t._wrapperState.initialValue&&e!==""&&e!==null&&(t.value=e)}function Zy(t){switch(t){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function eh(t,e){return t==null||t==="http://www.w3.org/1999/xhtml"?Zy(e):t==="http://www.w3.org/2000/svg"&&e==="foreignObject"?"http://www.w3.org/1999/xhtml":t}var Sa,ev=function(t){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(e,n,r,i){MSApp.execUnsafeLocalFunction(function(){return t(e,n,r,i)})}:t}(function(t,e){if(t.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in t)t.innerHTML=e;else{for(Sa=Sa||document.createElement("div"),Sa.innerHTML="<svg>"+e.valueOf().toString()+"</svg>",e=Sa.firstChild;t.firstChild;)t.removeChild(t.firstChild);for(;e.firstChild;)t.appendChild(e.firstChild)}});function vo(t,e){if(e){var n=t.firstChild;if(n&&n===t.lastChild&&n.nodeType===3){n.nodeValue=e;return}}t.textContent=e}var no={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},S0=["Webkit","ms","Moz","O"];Object.keys(no).forEach(function(t){S0.forEach(function(e){e=e+t.charAt(0).toUpperCase()+t.substring(1),no[e]=no[t]})});function tv(t,e,n){return e==null||typeof e=="boolean"||e===""?"":n||typeof e!="number"||e===0||no.hasOwnProperty(t)&&no[t]?(""+e).trim():e+"px"}function nv(t,e){t=t.style;for(var n in e)if(e.hasOwnProperty(n)){var r=n.indexOf("--")===0,i=tv(n,e[n],r);n==="float"&&(n="cssFloat"),r?t.setProperty(n,i):t[n]=i}}var A0=ke({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function th(t,e){if(e){if(A0[t]&&(e.children!=null||e.dangerouslySetInnerHTML!=null))throw Error(B(137,t));if(e.dangerouslySetInnerHTML!=null){if(e.children!=null)throw Error(B(60));if(typeof e.dangerouslySetInnerHTML!="object"||!("__html"in e.dangerouslySetInnerHTML))throw Error(B(61))}if(e.style!=null&&typeof e.style!="object")throw Error(B(62))}}function nh(t,e){if(t.indexOf("-")===-1)return typeof e.is=="string";switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var rh=null;function yd(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var ih=null,Li=null,Mi=null;function rm(t){if(t=Go(t)){if(typeof ih!="function")throw Error(B(280));var e=t.stateNode;e&&(e=uu(e),ih(t.stateNode,t.type,e))}}function rv(t){Li?Mi?Mi.push(t):Mi=[t]:Li=t}function iv(){if(Li){var t=Li,e=Mi;if(Mi=Li=null,rm(t),e)for(t=0;t<e.length;t++)rm(e[t])}}function sv(t,e){return t(e)}function ov(){}var hc=!1;function av(t,e,n){if(hc)return t(e,n);hc=!0;try{return sv(t,e,n)}finally{hc=!1,(Li!==null||Mi!==null)&&(ov(),iv())}}function _o(t,e){var n=t.stateNode;if(n===null)return null;var r=uu(n);if(r===null)return null;n=r[e];e:switch(e){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(t=t.type,r=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!r;break e;default:t=!1}if(t)return null;if(n&&typeof n!="function")throw Error(B(231,e,typeof n));return n}var sh=!1;if(Pn)try{var Ms={};Object.defineProperty(Ms,"passive",{get:function(){sh=!0}}),window.addEventListener("test",Ms,Ms),window.removeEventListener("test",Ms,Ms)}catch{sh=!1}function C0(t,e,n,r,i,s,o,l,u){var h=Array.prototype.slice.call(arguments,3);try{e.apply(n,h)}catch(p){this.onError(p)}}var ro=!1,ml=null,gl=!1,oh=null,R0={onError:function(t){ro=!0,ml=t}};function k0(t,e,n,r,i,s,o,l,u){ro=!1,ml=null,C0.apply(R0,arguments)}function P0(t,e,n,r,i,s,o,l,u){if(k0.apply(this,arguments),ro){if(ro){var h=ml;ro=!1,ml=null}else throw Error(B(198));gl||(gl=!0,oh=h)}}function ui(t){var e=t,n=t;if(t.alternate)for(;e.return;)e=e.return;else{t=e;do e=t,e.flags&4098&&(n=e.return),t=e.return;while(t)}return e.tag===3?n:null}function lv(t){if(t.tag===13){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function im(t){if(ui(t)!==t)throw Error(B(188))}function N0(t){var e=t.alternate;if(!e){if(e=ui(t),e===null)throw Error(B(188));return e!==t?null:t}for(var n=t,r=e;;){var i=n.return;if(i===null)break;var s=i.alternate;if(s===null){if(r=i.return,r!==null){n=r;continue}break}if(i.child===s.child){for(s=i.child;s;){if(s===n)return im(i),t;if(s===r)return im(i),e;s=s.sibling}throw Error(B(188))}if(n.return!==r.return)n=i,r=s;else{for(var o=!1,l=i.child;l;){if(l===n){o=!0,n=i,r=s;break}if(l===r){o=!0,r=i,n=s;break}l=l.sibling}if(!o){for(l=s.child;l;){if(l===n){o=!0,n=s,r=i;break}if(l===r){o=!0,r=s,n=i;break}l=l.sibling}if(!o)throw Error(B(189))}}if(n.alternate!==r)throw Error(B(190))}if(n.tag!==3)throw Error(B(188));return n.stateNode.current===n?t:e}function uv(t){return t=N0(t),t!==null?cv(t):null}function cv(t){if(t.tag===5||t.tag===6)return t;for(t=t.child;t!==null;){var e=cv(t);if(e!==null)return e;t=t.sibling}return null}var hv=xt.unstable_scheduleCallback,sm=xt.unstable_cancelCallback,x0=xt.unstable_shouldYield,b0=xt.unstable_requestPaint,De=xt.unstable_now,D0=xt.unstable_getCurrentPriorityLevel,vd=xt.unstable_ImmediatePriority,dv=xt.unstable_UserBlockingPriority,yl=xt.unstable_NormalPriority,V0=xt.unstable_LowPriority,fv=xt.unstable_IdlePriority,su=null,ln=null;function O0(t){if(ln&&typeof ln.onCommitFiberRoot=="function")try{ln.onCommitFiberRoot(su,t,void 0,(t.current.flags&128)===128)}catch{}}var Qt=Math.clz32?Math.clz32:F0,L0=Math.log,M0=Math.LN2;function F0(t){return t>>>=0,t===0?32:31-(L0(t)/M0|0)|0}var Aa=64,Ca=4194304;function Ks(t){switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return t&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return t}}function vl(t,e){var n=t.pendingLanes;if(n===0)return 0;var r=0,i=t.suspendedLanes,s=t.pingedLanes,o=n&268435455;if(o!==0){var l=o&~i;l!==0?r=Ks(l):(s&=o,s!==0&&(r=Ks(s)))}else o=n&~i,o!==0?r=Ks(o):s!==0&&(r=Ks(s));if(r===0)return 0;if(e!==0&&e!==r&&!(e&i)&&(i=r&-r,s=e&-e,i>=s||i===16&&(s&4194240)!==0))return e;if(r&4&&(r|=n&16),e=t.entangledLanes,e!==0)for(t=t.entanglements,e&=r;0<e;)n=31-Qt(e),i=1<<n,r|=t[n],e&=~i;return r}function U0(t,e){switch(t){case 1:case 2:case 4:return e+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function z0(t,e){for(var n=t.suspendedLanes,r=t.pingedLanes,i=t.expirationTimes,s=t.pendingLanes;0<s;){var o=31-Qt(s),l=1<<o,u=i[o];u===-1?(!(l&n)||l&r)&&(i[o]=U0(l,e)):u<=e&&(t.expiredLanes|=l),s&=~l}}function ah(t){return t=t.pendingLanes&-1073741825,t!==0?t:t&1073741824?1073741824:0}function pv(){var t=Aa;return Aa<<=1,!(Aa&4194240)&&(Aa=64),t}function dc(t){for(var e=[],n=0;31>n;n++)e.push(t);return e}function Ho(t,e,n){t.pendingLanes|=e,e!==536870912&&(t.suspendedLanes=0,t.pingedLanes=0),t=t.eventTimes,e=31-Qt(e),t[e]=n}function B0(t,e){var n=t.pendingLanes&~e;t.pendingLanes=e,t.suspendedLanes=0,t.pingedLanes=0,t.expiredLanes&=e,t.mutableReadLanes&=e,t.entangledLanes&=e,e=t.entanglements;var r=t.eventTimes;for(t=t.expirationTimes;0<n;){var i=31-Qt(n),s=1<<i;e[i]=0,r[i]=-1,t[i]=-1,n&=~s}}function _d(t,e){var n=t.entangledLanes|=e;for(t=t.entanglements;n;){var r=31-Qt(n),i=1<<r;i&e|t[r]&e&&(t[r]|=e),n&=~i}}var pe=0;function mv(t){return t&=-t,1<t?4<t?t&268435455?16:536870912:4:1}var gv,Ed,yv,vv,_v,lh=!1,Ra=[],or=null,ar=null,lr=null,Eo=new Map,wo=new Map,Xn=[],j0="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function om(t,e){switch(t){case"focusin":case"focusout":or=null;break;case"dragenter":case"dragleave":ar=null;break;case"mouseover":case"mouseout":lr=null;break;case"pointerover":case"pointerout":Eo.delete(e.pointerId);break;case"gotpointercapture":case"lostpointercapture":wo.delete(e.pointerId)}}function Fs(t,e,n,r,i,s){return t===null||t.nativeEvent!==s?(t={blockedOn:e,domEventName:n,eventSystemFlags:r,nativeEvent:s,targetContainers:[i]},e!==null&&(e=Go(e),e!==null&&Ed(e)),t):(t.eventSystemFlags|=r,e=t.targetContainers,i!==null&&e.indexOf(i)===-1&&e.push(i),t)}function $0(t,e,n,r,i){switch(e){case"focusin":return or=Fs(or,t,e,n,r,i),!0;case"dragenter":return ar=Fs(ar,t,e,n,r,i),!0;case"mouseover":return lr=Fs(lr,t,e,n,r,i),!0;case"pointerover":var s=i.pointerId;return Eo.set(s,Fs(Eo.get(s)||null,t,e,n,r,i)),!0;case"gotpointercapture":return s=i.pointerId,wo.set(s,Fs(wo.get(s)||null,t,e,n,r,i)),!0}return!1}function Ev(t){var e=$r(t.target);if(e!==null){var n=ui(e);if(n!==null){if(e=n.tag,e===13){if(e=lv(n),e!==null){t.blockedOn=e,_v(t.priority,function(){yv(n)});return}}else if(e===3&&n.stateNode.current.memoizedState.isDehydrated){t.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}t.blockedOn=null}function Ka(t){if(t.blockedOn!==null)return!1;for(var e=t.targetContainers;0<e.length;){var n=uh(t.domEventName,t.eventSystemFlags,e[0],t.nativeEvent);if(n===null){n=t.nativeEvent;var r=new n.constructor(n.type,n);rh=r,n.target.dispatchEvent(r),rh=null}else return e=Go(n),e!==null&&Ed(e),t.blockedOn=n,!1;e.shift()}return!0}function am(t,e,n){Ka(t)&&n.delete(e)}function W0(){lh=!1,or!==null&&Ka(or)&&(or=null),ar!==null&&Ka(ar)&&(ar=null),lr!==null&&Ka(lr)&&(lr=null),Eo.forEach(am),wo.forEach(am)}function Us(t,e){t.blockedOn===e&&(t.blockedOn=null,lh||(lh=!0,xt.unstable_scheduleCallback(xt.unstable_NormalPriority,W0)))}function To(t){function e(i){return Us(i,t)}if(0<Ra.length){Us(Ra[0],t);for(var n=1;n<Ra.length;n++){var r=Ra[n];r.blockedOn===t&&(r.blockedOn=null)}}for(or!==null&&Us(or,t),ar!==null&&Us(ar,t),lr!==null&&Us(lr,t),Eo.forEach(e),wo.forEach(e),n=0;n<Xn.length;n++)r=Xn[n],r.blockedOn===t&&(r.blockedOn=null);for(;0<Xn.length&&(n=Xn[0],n.blockedOn===null);)Ev(n),n.blockedOn===null&&Xn.shift()}var Fi=Mn.ReactCurrentBatchConfig,_l=!0;function H0(t,e,n,r){var i=pe,s=Fi.transition;Fi.transition=null;try{pe=1,wd(t,e,n,r)}finally{pe=i,Fi.transition=s}}function q0(t,e,n,r){var i=pe,s=Fi.transition;Fi.transition=null;try{pe=4,wd(t,e,n,r)}finally{pe=i,Fi.transition=s}}function wd(t,e,n,r){if(_l){var i=uh(t,e,n,r);if(i===null)Tc(t,e,r,El,n),om(t,r);else if($0(i,t,e,n,r))r.stopPropagation();else if(om(t,r),e&4&&-1<j0.indexOf(t)){for(;i!==null;){var s=Go(i);if(s!==null&&gv(s),s=uh(t,e,n,r),s===null&&Tc(t,e,r,El,n),s===i)break;i=s}i!==null&&r.stopPropagation()}else Tc(t,e,r,null,n)}}var El=null;function uh(t,e,n,r){if(El=null,t=yd(r),t=$r(t),t!==null)if(e=ui(t),e===null)t=null;else if(n=e.tag,n===13){if(t=lv(e),t!==null)return t;t=null}else if(n===3){if(e.stateNode.current.memoizedState.isDehydrated)return e.tag===3?e.stateNode.containerInfo:null;t=null}else e!==t&&(t=null);return El=t,null}function wv(t){switch(t){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(D0()){case vd:return 1;case dv:return 4;case yl:case V0:return 16;case fv:return 536870912;default:return 16}default:return 16}}var rr=null,Td=null,Qa=null;function Tv(){if(Qa)return Qa;var t,e=Td,n=e.length,r,i="value"in rr?rr.value:rr.textContent,s=i.length;for(t=0;t<n&&e[t]===i[t];t++);var o=n-t;for(r=1;r<=o&&e[n-r]===i[s-r];r++);return Qa=i.slice(t,1<r?1-r:void 0)}function Ya(t){var e=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&e===13&&(t=13)):t=e,t===10&&(t=13),32<=t||t===13?t:0}function ka(){return!0}function lm(){return!1}function Dt(t){function e(n,r,i,s,o){this._reactName=n,this._targetInst=i,this.type=r,this.nativeEvent=s,this.target=o,this.currentTarget=null;for(var l in t)t.hasOwnProperty(l)&&(n=t[l],this[l]=n?n(s):s[l]);return this.isDefaultPrevented=(s.defaultPrevented!=null?s.defaultPrevented:s.returnValue===!1)?ka:lm,this.isPropagationStopped=lm,this}return ke(e.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=ka)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=ka)},persist:function(){},isPersistent:ka}),e}var us={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Id=Dt(us),qo=ke({},us,{view:0,detail:0}),G0=Dt(qo),fc,pc,zs,ou=ke({},qo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Sd,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==zs&&(zs&&t.type==="mousemove"?(fc=t.screenX-zs.screenX,pc=t.screenY-zs.screenY):pc=fc=0,zs=t),fc)},movementY:function(t){return"movementY"in t?t.movementY:pc}}),um=Dt(ou),K0=ke({},ou,{dataTransfer:0}),Q0=Dt(K0),Y0=ke({},qo,{relatedTarget:0}),mc=Dt(Y0),X0=ke({},us,{animationName:0,elapsedTime:0,pseudoElement:0}),J0=Dt(X0),Z0=ke({},us,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),eI=Dt(Z0),tI=ke({},us,{data:0}),cm=Dt(tI),nI={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},rI={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},iI={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function sI(t){var e=this.nativeEvent;return e.getModifierState?e.getModifierState(t):(t=iI[t])?!!e[t]:!1}function Sd(){return sI}var oI=ke({},qo,{key:function(t){if(t.key){var e=nI[t.key]||t.key;if(e!=="Unidentified")return e}return t.type==="keypress"?(t=Ya(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?rI[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Sd,charCode:function(t){return t.type==="keypress"?Ya(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Ya(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),aI=Dt(oI),lI=ke({},ou,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),hm=Dt(lI),uI=ke({},qo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Sd}),cI=Dt(uI),hI=ke({},us,{propertyName:0,elapsedTime:0,pseudoElement:0}),dI=Dt(hI),fI=ke({},ou,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),pI=Dt(fI),mI=[9,13,27,32],Ad=Pn&&"CompositionEvent"in window,io=null;Pn&&"documentMode"in document&&(io=document.documentMode);var gI=Pn&&"TextEvent"in window&&!io,Iv=Pn&&(!Ad||io&&8<io&&11>=io),dm=" ",fm=!1;function Sv(t,e){switch(t){case"keyup":return mI.indexOf(e.keyCode)!==-1;case"keydown":return e.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Av(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var Ii=!1;function yI(t,e){switch(t){case"compositionend":return Av(e);case"keypress":return e.which!==32?null:(fm=!0,dm);case"textInput":return t=e.data,t===dm&&fm?null:t;default:return null}}function vI(t,e){if(Ii)return t==="compositionend"||!Ad&&Sv(t,e)?(t=Tv(),Qa=Td=rr=null,Ii=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(e.ctrlKey||e.altKey||e.metaKey)||e.ctrlKey&&e.altKey){if(e.char&&1<e.char.length)return e.char;if(e.which)return String.fromCharCode(e.which)}return null;case"compositionend":return Iv&&e.locale!=="ko"?null:e.data;default:return null}}var _I={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function pm(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e==="input"?!!_I[t.type]:e==="textarea"}function Cv(t,e,n,r){rv(r),e=wl(e,"onChange"),0<e.length&&(n=new Id("onChange","change",null,n,r),t.push({event:n,listeners:e}))}var so=null,Io=null;function EI(t){Mv(t,0)}function au(t){var e=Ci(t);if(Yy(e))return t}function wI(t,e){if(t==="change")return e}var Rv=!1;if(Pn){var gc;if(Pn){var yc="oninput"in document;if(!yc){var mm=document.createElement("div");mm.setAttribute("oninput","return;"),yc=typeof mm.oninput=="function"}gc=yc}else gc=!1;Rv=gc&&(!document.documentMode||9<document.documentMode)}function gm(){so&&(so.detachEvent("onpropertychange",kv),Io=so=null)}function kv(t){if(t.propertyName==="value"&&au(Io)){var e=[];Cv(e,Io,t,yd(t)),av(EI,e)}}function TI(t,e,n){t==="focusin"?(gm(),so=e,Io=n,so.attachEvent("onpropertychange",kv)):t==="focusout"&&gm()}function II(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return au(Io)}function SI(t,e){if(t==="click")return au(e)}function AI(t,e){if(t==="input"||t==="change")return au(e)}function CI(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var Zt=typeof Object.is=="function"?Object.is:CI;function So(t,e){if(Zt(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;var n=Object.keys(t),r=Object.keys(e);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!Hc.call(e,i)||!Zt(t[i],e[i]))return!1}return!0}function ym(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function vm(t,e){var n=ym(t);t=0;for(var r;n;){if(n.nodeType===3){if(r=t+n.textContent.length,t<=e&&r>=e)return{node:n,offset:e-t};t=r}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=ym(n)}}function Pv(t,e){return t&&e?t===e?!0:t&&t.nodeType===3?!1:e&&e.nodeType===3?Pv(t,e.parentNode):"contains"in t?t.contains(e):t.compareDocumentPosition?!!(t.compareDocumentPosition(e)&16):!1:!1}function Nv(){for(var t=window,e=pl();e instanceof t.HTMLIFrameElement;){try{var n=typeof e.contentWindow.location.href=="string"}catch{n=!1}if(n)t=e.contentWindow;else break;e=pl(t.document)}return e}function Cd(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e&&(e==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||e==="textarea"||t.contentEditable==="true")}function RI(t){var e=Nv(),n=t.focusedElem,r=t.selectionRange;if(e!==n&&n&&n.ownerDocument&&Pv(n.ownerDocument.documentElement,n)){if(r!==null&&Cd(n)){if(e=r.start,t=r.end,t===void 0&&(t=e),"selectionStart"in n)n.selectionStart=e,n.selectionEnd=Math.min(t,n.value.length);else if(t=(e=n.ownerDocument||document)&&e.defaultView||window,t.getSelection){t=t.getSelection();var i=n.textContent.length,s=Math.min(r.start,i);r=r.end===void 0?s:Math.min(r.end,i),!t.extend&&s>r&&(i=r,r=s,s=i),i=vm(n,s);var o=vm(n,r);i&&o&&(t.rangeCount!==1||t.anchorNode!==i.node||t.anchorOffset!==i.offset||t.focusNode!==o.node||t.focusOffset!==o.offset)&&(e=e.createRange(),e.setStart(i.node,i.offset),t.removeAllRanges(),s>r?(t.addRange(e),t.extend(o.node,o.offset)):(e.setEnd(o.node,o.offset),t.addRange(e)))}}for(e=[],t=n;t=t.parentNode;)t.nodeType===1&&e.push({element:t,left:t.scrollLeft,top:t.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<e.length;n++)t=e[n],t.element.scrollLeft=t.left,t.element.scrollTop=t.top}}var kI=Pn&&"documentMode"in document&&11>=document.documentMode,Si=null,ch=null,oo=null,hh=!1;function _m(t,e,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;hh||Si==null||Si!==pl(r)||(r=Si,"selectionStart"in r&&Cd(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),oo&&So(oo,r)||(oo=r,r=wl(ch,"onSelect"),0<r.length&&(e=new Id("onSelect","select",null,e,n),t.push({event:e,listeners:r}),e.target=Si)))}function Pa(t,e){var n={};return n[t.toLowerCase()]=e.toLowerCase(),n["Webkit"+t]="webkit"+e,n["Moz"+t]="moz"+e,n}var Ai={animationend:Pa("Animation","AnimationEnd"),animationiteration:Pa("Animation","AnimationIteration"),animationstart:Pa("Animation","AnimationStart"),transitionend:Pa("Transition","TransitionEnd")},vc={},xv={};Pn&&(xv=document.createElement("div").style,"AnimationEvent"in window||(delete Ai.animationend.animation,delete Ai.animationiteration.animation,delete Ai.animationstart.animation),"TransitionEvent"in window||delete Ai.transitionend.transition);function lu(t){if(vc[t])return vc[t];if(!Ai[t])return t;var e=Ai[t],n;for(n in e)if(e.hasOwnProperty(n)&&n in xv)return vc[t]=e[n];return t}var bv=lu("animationend"),Dv=lu("animationiteration"),Vv=lu("animationstart"),Ov=lu("transitionend"),Lv=new Map,Em="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Pr(t,e){Lv.set(t,e),li(e,[t])}for(var _c=0;_c<Em.length;_c++){var Ec=Em[_c],PI=Ec.toLowerCase(),NI=Ec[0].toUpperCase()+Ec.slice(1);Pr(PI,"on"+NI)}Pr(bv,"onAnimationEnd");Pr(Dv,"onAnimationIteration");Pr(Vv,"onAnimationStart");Pr("dblclick","onDoubleClick");Pr("focusin","onFocus");Pr("focusout","onBlur");Pr(Ov,"onTransitionEnd");Gi("onMouseEnter",["mouseout","mouseover"]);Gi("onMouseLeave",["mouseout","mouseover"]);Gi("onPointerEnter",["pointerout","pointerover"]);Gi("onPointerLeave",["pointerout","pointerover"]);li("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));li("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));li("onBeforeInput",["compositionend","keypress","textInput","paste"]);li("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));li("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));li("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Qs="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),xI=new Set("cancel close invalid load scroll toggle".split(" ").concat(Qs));function wm(t,e,n){var r=t.type||"unknown-event";t.currentTarget=n,P0(r,e,void 0,t),t.currentTarget=null}function Mv(t,e){e=(e&4)!==0;for(var n=0;n<t.length;n++){var r=t[n],i=r.event;r=r.listeners;e:{var s=void 0;if(e)for(var o=r.length-1;0<=o;o--){var l=r[o],u=l.instance,h=l.currentTarget;if(l=l.listener,u!==s&&i.isPropagationStopped())break e;wm(i,l,h),s=u}else for(o=0;o<r.length;o++){if(l=r[o],u=l.instance,h=l.currentTarget,l=l.listener,u!==s&&i.isPropagationStopped())break e;wm(i,l,h),s=u}}}if(gl)throw t=oh,gl=!1,oh=null,t}function Ee(t,e){var n=e[gh];n===void 0&&(n=e[gh]=new Set);var r=t+"__bubble";n.has(r)||(Fv(e,t,2,!1),n.add(r))}function wc(t,e,n){var r=0;e&&(r|=4),Fv(n,t,r,e)}var Na="_reactListening"+Math.random().toString(36).slice(2);function Ao(t){if(!t[Na]){t[Na]=!0,Hy.forEach(function(n){n!=="selectionchange"&&(xI.has(n)||wc(n,!1,t),wc(n,!0,t))});var e=t.nodeType===9?t:t.ownerDocument;e===null||e[Na]||(e[Na]=!0,wc("selectionchange",!1,e))}}function Fv(t,e,n,r){switch(wv(e)){case 1:var i=H0;break;case 4:i=q0;break;default:i=wd}n=i.bind(null,e,n,t),i=void 0,!sh||e!=="touchstart"&&e!=="touchmove"&&e!=="wheel"||(i=!0),r?i!==void 0?t.addEventListener(e,n,{capture:!0,passive:i}):t.addEventListener(e,n,!0):i!==void 0?t.addEventListener(e,n,{passive:i}):t.addEventListener(e,n,!1)}function Tc(t,e,n,r,i){var s=r;if(!(e&1)&&!(e&2)&&r!==null)e:for(;;){if(r===null)return;var o=r.tag;if(o===3||o===4){var l=r.stateNode.containerInfo;if(l===i||l.nodeType===8&&l.parentNode===i)break;if(o===4)for(o=r.return;o!==null;){var u=o.tag;if((u===3||u===4)&&(u=o.stateNode.containerInfo,u===i||u.nodeType===8&&u.parentNode===i))return;o=o.return}for(;l!==null;){if(o=$r(l),o===null)return;if(u=o.tag,u===5||u===6){r=s=o;continue e}l=l.parentNode}}r=r.return}av(function(){var h=s,p=yd(n),m=[];e:{var g=Lv.get(t);if(g!==void 0){var _=Id,N=t;switch(t){case"keypress":if(Ya(n)===0)break e;case"keydown":case"keyup":_=aI;break;case"focusin":N="focus",_=mc;break;case"focusout":N="blur",_=mc;break;case"beforeblur":case"afterblur":_=mc;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":_=um;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":_=Q0;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":_=cI;break;case bv:case Dv:case Vv:_=J0;break;case Ov:_=dI;break;case"scroll":_=G0;break;case"wheel":_=pI;break;case"copy":case"cut":case"paste":_=eI;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":_=hm}var R=(e&4)!==0,k=!R&&t==="scroll",I=R?g!==null?g+"Capture":null:g;R=[];for(var T=h,P;T!==null;){P=T;var b=P.stateNode;if(P.tag===5&&b!==null&&(P=b,I!==null&&(b=_o(T,I),b!=null&&R.push(Co(T,b,P)))),k)break;T=T.return}0<R.length&&(g=new _(g,N,null,n,p),m.push({event:g,listeners:R}))}}if(!(e&7)){e:{if(g=t==="mouseover"||t==="pointerover",_=t==="mouseout"||t==="pointerout",g&&n!==rh&&(N=n.relatedTarget||n.fromElement)&&($r(N)||N[Nn]))break e;if((_||g)&&(g=p.window===p?p:(g=p.ownerDocument)?g.defaultView||g.parentWindow:window,_?(N=n.relatedTarget||n.toElement,_=h,N=N?$r(N):null,N!==null&&(k=ui(N),N!==k||N.tag!==5&&N.tag!==6)&&(N=null)):(_=null,N=h),_!==N)){if(R=um,b="onMouseLeave",I="onMouseEnter",T="mouse",(t==="pointerout"||t==="pointerover")&&(R=hm,b="onPointerLeave",I="onPointerEnter",T="pointer"),k=_==null?g:Ci(_),P=N==null?g:Ci(N),g=new R(b,T+"leave",_,n,p),g.target=k,g.relatedTarget=P,b=null,$r(p)===h&&(R=new R(I,T+"enter",N,n,p),R.target=P,R.relatedTarget=k,b=R),k=b,_&&N)t:{for(R=_,I=N,T=0,P=R;P;P=gi(P))T++;for(P=0,b=I;b;b=gi(b))P++;for(;0<T-P;)R=gi(R),T--;for(;0<P-T;)I=gi(I),P--;for(;T--;){if(R===I||I!==null&&R===I.alternate)break t;R=gi(R),I=gi(I)}R=null}else R=null;_!==null&&Tm(m,g,_,R,!1),N!==null&&k!==null&&Tm(m,k,N,R,!0)}}e:{if(g=h?Ci(h):window,_=g.nodeName&&g.nodeName.toLowerCase(),_==="select"||_==="input"&&g.type==="file")var V=wI;else if(pm(g))if(Rv)V=AI;else{V=II;var M=TI}else(_=g.nodeName)&&_.toLowerCase()==="input"&&(g.type==="checkbox"||g.type==="radio")&&(V=SI);if(V&&(V=V(t,h))){Cv(m,V,n,p);break e}M&&M(t,g,h),t==="focusout"&&(M=g._wrapperState)&&M.controlled&&g.type==="number"&&Jc(g,"number",g.value)}switch(M=h?Ci(h):window,t){case"focusin":(pm(M)||M.contentEditable==="true")&&(Si=M,ch=h,oo=null);break;case"focusout":oo=ch=Si=null;break;case"mousedown":hh=!0;break;case"contextmenu":case"mouseup":case"dragend":hh=!1,_m(m,n,p);break;case"selectionchange":if(kI)break;case"keydown":case"keyup":_m(m,n,p)}var w;if(Ad)e:{switch(t){case"compositionstart":var v="onCompositionStart";break e;case"compositionend":v="onCompositionEnd";break e;case"compositionupdate":v="onCompositionUpdate";break e}v=void 0}else Ii?Sv(t,n)&&(v="onCompositionEnd"):t==="keydown"&&n.keyCode===229&&(v="onCompositionStart");v&&(Iv&&n.locale!=="ko"&&(Ii||v!=="onCompositionStart"?v==="onCompositionEnd"&&Ii&&(w=Tv()):(rr=p,Td="value"in rr?rr.value:rr.textContent,Ii=!0)),M=wl(h,v),0<M.length&&(v=new cm(v,t,null,n,p),m.push({event:v,listeners:M}),w?v.data=w:(w=Av(n),w!==null&&(v.data=w)))),(w=gI?yI(t,n):vI(t,n))&&(h=wl(h,"onBeforeInput"),0<h.length&&(p=new cm("onBeforeInput","beforeinput",null,n,p),m.push({event:p,listeners:h}),p.data=w))}Mv(m,e)})}function Co(t,e,n){return{instance:t,listener:e,currentTarget:n}}function wl(t,e){for(var n=e+"Capture",r=[];t!==null;){var i=t,s=i.stateNode;i.tag===5&&s!==null&&(i=s,s=_o(t,n),s!=null&&r.unshift(Co(t,s,i)),s=_o(t,e),s!=null&&r.push(Co(t,s,i))),t=t.return}return r}function gi(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5);return t||null}function Tm(t,e,n,r,i){for(var s=e._reactName,o=[];n!==null&&n!==r;){var l=n,u=l.alternate,h=l.stateNode;if(u!==null&&u===r)break;l.tag===5&&h!==null&&(l=h,i?(u=_o(n,s),u!=null&&o.unshift(Co(n,u,l))):i||(u=_o(n,s),u!=null&&o.push(Co(n,u,l)))),n=n.return}o.length!==0&&t.push({event:e,listeners:o})}var bI=/\r\n?/g,DI=/\u0000|\uFFFD/g;function Im(t){return(typeof t=="string"?t:""+t).replace(bI,`
`).replace(DI,"")}function xa(t,e,n){if(e=Im(e),Im(t)!==e&&n)throw Error(B(425))}function Tl(){}var dh=null,fh=null;function ph(t,e){return t==="textarea"||t==="noscript"||typeof e.children=="string"||typeof e.children=="number"||typeof e.dangerouslySetInnerHTML=="object"&&e.dangerouslySetInnerHTML!==null&&e.dangerouslySetInnerHTML.__html!=null}var mh=typeof setTimeout=="function"?setTimeout:void 0,VI=typeof clearTimeout=="function"?clearTimeout:void 0,Sm=typeof Promise=="function"?Promise:void 0,OI=typeof queueMicrotask=="function"?queueMicrotask:typeof Sm<"u"?function(t){return Sm.resolve(null).then(t).catch(LI)}:mh;function LI(t){setTimeout(function(){throw t})}function Ic(t,e){var n=e,r=0;do{var i=n.nextSibling;if(t.removeChild(n),i&&i.nodeType===8)if(n=i.data,n==="/$"){if(r===0){t.removeChild(i),To(e);return}r--}else n!=="$"&&n!=="$?"&&n!=="$!"||r++;n=i}while(n);To(e)}function ur(t){for(;t!=null;t=t.nextSibling){var e=t.nodeType;if(e===1||e===3)break;if(e===8){if(e=t.data,e==="$"||e==="$!"||e==="$?")break;if(e==="/$")return null}}return t}function Am(t){t=t.previousSibling;for(var e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="$"||n==="$!"||n==="$?"){if(e===0)return t;e--}else n==="/$"&&e++}t=t.previousSibling}return null}var cs=Math.random().toString(36).slice(2),an="__reactFiber$"+cs,Ro="__reactProps$"+cs,Nn="__reactContainer$"+cs,gh="__reactEvents$"+cs,MI="__reactListeners$"+cs,FI="__reactHandles$"+cs;function $r(t){var e=t[an];if(e)return e;for(var n=t.parentNode;n;){if(e=n[Nn]||n[an]){if(n=e.alternate,e.child!==null||n!==null&&n.child!==null)for(t=Am(t);t!==null;){if(n=t[an])return n;t=Am(t)}return e}t=n,n=t.parentNode}return null}function Go(t){return t=t[an]||t[Nn],!t||t.tag!==5&&t.tag!==6&&t.tag!==13&&t.tag!==3?null:t}function Ci(t){if(t.tag===5||t.tag===6)return t.stateNode;throw Error(B(33))}function uu(t){return t[Ro]||null}var yh=[],Ri=-1;function Nr(t){return{current:t}}function Ie(t){0>Ri||(t.current=yh[Ri],yh[Ri]=null,Ri--)}function ye(t,e){Ri++,yh[Ri]=t.current,t.current=e}var wr={},ut=Nr(wr),It=Nr(!1),Yr=wr;function Ki(t,e){var n=t.type.contextTypes;if(!n)return wr;var r=t.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===e)return r.__reactInternalMemoizedMaskedChildContext;var i={},s;for(s in n)i[s]=e[s];return r&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=e,t.__reactInternalMemoizedMaskedChildContext=i),i}function St(t){return t=t.childContextTypes,t!=null}function Il(){Ie(It),Ie(ut)}function Cm(t,e,n){if(ut.current!==wr)throw Error(B(168));ye(ut,e),ye(It,n)}function Uv(t,e,n){var r=t.stateNode;if(e=e.childContextTypes,typeof r.getChildContext!="function")return n;r=r.getChildContext();for(var i in r)if(!(i in e))throw Error(B(108,T0(t)||"Unknown",i));return ke({},n,r)}function Sl(t){return t=(t=t.stateNode)&&t.__reactInternalMemoizedMergedChildContext||wr,Yr=ut.current,ye(ut,t),ye(It,It.current),!0}function Rm(t,e,n){var r=t.stateNode;if(!r)throw Error(B(169));n?(t=Uv(t,e,Yr),r.__reactInternalMemoizedMergedChildContext=t,Ie(It),Ie(ut),ye(ut,t)):Ie(It),ye(It,n)}var _n=null,cu=!1,Sc=!1;function zv(t){_n===null?_n=[t]:_n.push(t)}function UI(t){cu=!0,zv(t)}function xr(){if(!Sc&&_n!==null){Sc=!0;var t=0,e=pe;try{var n=_n;for(pe=1;t<n.length;t++){var r=n[t];do r=r(!0);while(r!==null)}_n=null,cu=!1}catch(i){throw _n!==null&&(_n=_n.slice(t+1)),hv(vd,xr),i}finally{pe=e,Sc=!1}}return null}var ki=[],Pi=0,Al=null,Cl=0,Ot=[],Lt=0,Xr=null,En=1,wn="";function zr(t,e){ki[Pi++]=Cl,ki[Pi++]=Al,Al=t,Cl=e}function Bv(t,e,n){Ot[Lt++]=En,Ot[Lt++]=wn,Ot[Lt++]=Xr,Xr=t;var r=En;t=wn;var i=32-Qt(r)-1;r&=~(1<<i),n+=1;var s=32-Qt(e)+i;if(30<s){var o=i-i%5;s=(r&(1<<o)-1).toString(32),r>>=o,i-=o,En=1<<32-Qt(e)+i|n<<i|r,wn=s+t}else En=1<<s|n<<i|r,wn=t}function Rd(t){t.return!==null&&(zr(t,1),Bv(t,1,0))}function kd(t){for(;t===Al;)Al=ki[--Pi],ki[Pi]=null,Cl=ki[--Pi],ki[Pi]=null;for(;t===Xr;)Xr=Ot[--Lt],Ot[Lt]=null,wn=Ot[--Lt],Ot[Lt]=null,En=Ot[--Lt],Ot[Lt]=null}var Nt=null,kt=null,Ae=!1,Gt=null;function jv(t,e){var n=Ut(5,null,null,0);n.elementType="DELETED",n.stateNode=e,n.return=t,e=t.deletions,e===null?(t.deletions=[n],t.flags|=16):e.push(n)}function km(t,e){switch(t.tag){case 5:var n=t.type;return e=e.nodeType!==1||n.toLowerCase()!==e.nodeName.toLowerCase()?null:e,e!==null?(t.stateNode=e,Nt=t,kt=ur(e.firstChild),!0):!1;case 6:return e=t.pendingProps===""||e.nodeType!==3?null:e,e!==null?(t.stateNode=e,Nt=t,kt=null,!0):!1;case 13:return e=e.nodeType!==8?null:e,e!==null?(n=Xr!==null?{id:En,overflow:wn}:null,t.memoizedState={dehydrated:e,treeContext:n,retryLane:1073741824},n=Ut(18,null,null,0),n.stateNode=e,n.return=t,t.child=n,Nt=t,kt=null,!0):!1;default:return!1}}function vh(t){return(t.mode&1)!==0&&(t.flags&128)===0}function _h(t){if(Ae){var e=kt;if(e){var n=e;if(!km(t,e)){if(vh(t))throw Error(B(418));e=ur(n.nextSibling);var r=Nt;e&&km(t,e)?jv(r,n):(t.flags=t.flags&-4097|2,Ae=!1,Nt=t)}}else{if(vh(t))throw Error(B(418));t.flags=t.flags&-4097|2,Ae=!1,Nt=t}}}function Pm(t){for(t=t.return;t!==null&&t.tag!==5&&t.tag!==3&&t.tag!==13;)t=t.return;Nt=t}function ba(t){if(t!==Nt)return!1;if(!Ae)return Pm(t),Ae=!0,!1;var e;if((e=t.tag!==3)&&!(e=t.tag!==5)&&(e=t.type,e=e!=="head"&&e!=="body"&&!ph(t.type,t.memoizedProps)),e&&(e=kt)){if(vh(t))throw $v(),Error(B(418));for(;e;)jv(t,e),e=ur(e.nextSibling)}if(Pm(t),t.tag===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(B(317));e:{for(t=t.nextSibling,e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="/$"){if(e===0){kt=ur(t.nextSibling);break e}e--}else n!=="$"&&n!=="$!"&&n!=="$?"||e++}t=t.nextSibling}kt=null}}else kt=Nt?ur(t.stateNode.nextSibling):null;return!0}function $v(){for(var t=kt;t;)t=ur(t.nextSibling)}function Qi(){kt=Nt=null,Ae=!1}function Pd(t){Gt===null?Gt=[t]:Gt.push(t)}var zI=Mn.ReactCurrentBatchConfig;function Bs(t,e,n){if(t=n.ref,t!==null&&typeof t!="function"&&typeof t!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(B(309));var r=n.stateNode}if(!r)throw Error(B(147,t));var i=r,s=""+t;return e!==null&&e.ref!==null&&typeof e.ref=="function"&&e.ref._stringRef===s?e.ref:(e=function(o){var l=i.refs;o===null?delete l[s]:l[s]=o},e._stringRef=s,e)}if(typeof t!="string")throw Error(B(284));if(!n._owner)throw Error(B(290,t))}return t}function Da(t,e){throw t=Object.prototype.toString.call(e),Error(B(31,t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t))}function Nm(t){var e=t._init;return e(t._payload)}function Wv(t){function e(I,T){if(t){var P=I.deletions;P===null?(I.deletions=[T],I.flags|=16):P.push(T)}}function n(I,T){if(!t)return null;for(;T!==null;)e(I,T),T=T.sibling;return null}function r(I,T){for(I=new Map;T!==null;)T.key!==null?I.set(T.key,T):I.set(T.index,T),T=T.sibling;return I}function i(I,T){return I=fr(I,T),I.index=0,I.sibling=null,I}function s(I,T,P){return I.index=P,t?(P=I.alternate,P!==null?(P=P.index,P<T?(I.flags|=2,T):P):(I.flags|=2,T)):(I.flags|=1048576,T)}function o(I){return t&&I.alternate===null&&(I.flags|=2),I}function l(I,T,P,b){return T===null||T.tag!==6?(T=xc(P,I.mode,b),T.return=I,T):(T=i(T,P),T.return=I,T)}function u(I,T,P,b){var V=P.type;return V===Ti?p(I,T,P.props.children,b,P.key):T!==null&&(T.elementType===V||typeof V=="object"&&V!==null&&V.$$typeof===Qn&&Nm(V)===T.type)?(b=i(T,P.props),b.ref=Bs(I,T,P),b.return=I,b):(b=rl(P.type,P.key,P.props,null,I.mode,b),b.ref=Bs(I,T,P),b.return=I,b)}function h(I,T,P,b){return T===null||T.tag!==4||T.stateNode.containerInfo!==P.containerInfo||T.stateNode.implementation!==P.implementation?(T=bc(P,I.mode,b),T.return=I,T):(T=i(T,P.children||[]),T.return=I,T)}function p(I,T,P,b,V){return T===null||T.tag!==7?(T=Kr(P,I.mode,b,V),T.return=I,T):(T=i(T,P),T.return=I,T)}function m(I,T,P){if(typeof T=="string"&&T!==""||typeof T=="number")return T=xc(""+T,I.mode,P),T.return=I,T;if(typeof T=="object"&&T!==null){switch(T.$$typeof){case Ta:return P=rl(T.type,T.key,T.props,null,I.mode,P),P.ref=Bs(I,null,T),P.return=I,P;case wi:return T=bc(T,I.mode,P),T.return=I,T;case Qn:var b=T._init;return m(I,b(T._payload),P)}if(Gs(T)||Ls(T))return T=Kr(T,I.mode,P,null),T.return=I,T;Da(I,T)}return null}function g(I,T,P,b){var V=T!==null?T.key:null;if(typeof P=="string"&&P!==""||typeof P=="number")return V!==null?null:l(I,T,""+P,b);if(typeof P=="object"&&P!==null){switch(P.$$typeof){case Ta:return P.key===V?u(I,T,P,b):null;case wi:return P.key===V?h(I,T,P,b):null;case Qn:return V=P._init,g(I,T,V(P._payload),b)}if(Gs(P)||Ls(P))return V!==null?null:p(I,T,P,b,null);Da(I,P)}return null}function _(I,T,P,b,V){if(typeof b=="string"&&b!==""||typeof b=="number")return I=I.get(P)||null,l(T,I,""+b,V);if(typeof b=="object"&&b!==null){switch(b.$$typeof){case Ta:return I=I.get(b.key===null?P:b.key)||null,u(T,I,b,V);case wi:return I=I.get(b.key===null?P:b.key)||null,h(T,I,b,V);case Qn:var M=b._init;return _(I,T,P,M(b._payload),V)}if(Gs(b)||Ls(b))return I=I.get(P)||null,p(T,I,b,V,null);Da(T,b)}return null}function N(I,T,P,b){for(var V=null,M=null,w=T,v=T=0,E=null;w!==null&&v<P.length;v++){w.index>v?(E=w,w=null):E=w.sibling;var A=g(I,w,P[v],b);if(A===null){w===null&&(w=E);break}t&&w&&A.alternate===null&&e(I,w),T=s(A,T,v),M===null?V=A:M.sibling=A,M=A,w=E}if(v===P.length)return n(I,w),Ae&&zr(I,v),V;if(w===null){for(;v<P.length;v++)w=m(I,P[v],b),w!==null&&(T=s(w,T,v),M===null?V=w:M.sibling=w,M=w);return Ae&&zr(I,v),V}for(w=r(I,w);v<P.length;v++)E=_(w,I,v,P[v],b),E!==null&&(t&&E.alternate!==null&&w.delete(E.key===null?v:E.key),T=s(E,T,v),M===null?V=E:M.sibling=E,M=E);return t&&w.forEach(function(C){return e(I,C)}),Ae&&zr(I,v),V}function R(I,T,P,b){var V=Ls(P);if(typeof V!="function")throw Error(B(150));if(P=V.call(P),P==null)throw Error(B(151));for(var M=V=null,w=T,v=T=0,E=null,A=P.next();w!==null&&!A.done;v++,A=P.next()){w.index>v?(E=w,w=null):E=w.sibling;var C=g(I,w,A.value,b);if(C===null){w===null&&(w=E);break}t&&w&&C.alternate===null&&e(I,w),T=s(C,T,v),M===null?V=C:M.sibling=C,M=C,w=E}if(A.done)return n(I,w),Ae&&zr(I,v),V;if(w===null){for(;!A.done;v++,A=P.next())A=m(I,A.value,b),A!==null&&(T=s(A,T,v),M===null?V=A:M.sibling=A,M=A);return Ae&&zr(I,v),V}for(w=r(I,w);!A.done;v++,A=P.next())A=_(w,I,v,A.value,b),A!==null&&(t&&A.alternate!==null&&w.delete(A.key===null?v:A.key),T=s(A,T,v),M===null?V=A:M.sibling=A,M=A);return t&&w.forEach(function(x){return e(I,x)}),Ae&&zr(I,v),V}function k(I,T,P,b){if(typeof P=="object"&&P!==null&&P.type===Ti&&P.key===null&&(P=P.props.children),typeof P=="object"&&P!==null){switch(P.$$typeof){case Ta:e:{for(var V=P.key,M=T;M!==null;){if(M.key===V){if(V=P.type,V===Ti){if(M.tag===7){n(I,M.sibling),T=i(M,P.props.children),T.return=I,I=T;break e}}else if(M.elementType===V||typeof V=="object"&&V!==null&&V.$$typeof===Qn&&Nm(V)===M.type){n(I,M.sibling),T=i(M,P.props),T.ref=Bs(I,M,P),T.return=I,I=T;break e}n(I,M);break}else e(I,M);M=M.sibling}P.type===Ti?(T=Kr(P.props.children,I.mode,b,P.key),T.return=I,I=T):(b=rl(P.type,P.key,P.props,null,I.mode,b),b.ref=Bs(I,T,P),b.return=I,I=b)}return o(I);case wi:e:{for(M=P.key;T!==null;){if(T.key===M)if(T.tag===4&&T.stateNode.containerInfo===P.containerInfo&&T.stateNode.implementation===P.implementation){n(I,T.sibling),T=i(T,P.children||[]),T.return=I,I=T;break e}else{n(I,T);break}else e(I,T);T=T.sibling}T=bc(P,I.mode,b),T.return=I,I=T}return o(I);case Qn:return M=P._init,k(I,T,M(P._payload),b)}if(Gs(P))return N(I,T,P,b);if(Ls(P))return R(I,T,P,b);Da(I,P)}return typeof P=="string"&&P!==""||typeof P=="number"?(P=""+P,T!==null&&T.tag===6?(n(I,T.sibling),T=i(T,P),T.return=I,I=T):(n(I,T),T=xc(P,I.mode,b),T.return=I,I=T),o(I)):n(I,T)}return k}var Yi=Wv(!0),Hv=Wv(!1),Rl=Nr(null),kl=null,Ni=null,Nd=null;function xd(){Nd=Ni=kl=null}function bd(t){var e=Rl.current;Ie(Rl),t._currentValue=e}function Eh(t,e,n){for(;t!==null;){var r=t.alternate;if((t.childLanes&e)!==e?(t.childLanes|=e,r!==null&&(r.childLanes|=e)):r!==null&&(r.childLanes&e)!==e&&(r.childLanes|=e),t===n)break;t=t.return}}function Ui(t,e){kl=t,Nd=Ni=null,t=t.dependencies,t!==null&&t.firstContext!==null&&(t.lanes&e&&(Tt=!0),t.firstContext=null)}function Bt(t){var e=t._currentValue;if(Nd!==t)if(t={context:t,memoizedValue:e,next:null},Ni===null){if(kl===null)throw Error(B(308));Ni=t,kl.dependencies={lanes:0,firstContext:t}}else Ni=Ni.next=t;return e}var Wr=null;function Dd(t){Wr===null?Wr=[t]:Wr.push(t)}function qv(t,e,n,r){var i=e.interleaved;return i===null?(n.next=n,Dd(e)):(n.next=i.next,i.next=n),e.interleaved=n,xn(t,r)}function xn(t,e){t.lanes|=e;var n=t.alternate;for(n!==null&&(n.lanes|=e),n=t,t=t.return;t!==null;)t.childLanes|=e,n=t.alternate,n!==null&&(n.childLanes|=e),n=t,t=t.return;return n.tag===3?n.stateNode:null}var Yn=!1;function Vd(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Gv(t,e){t=t.updateQueue,e.updateQueue===t&&(e.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,effects:t.effects})}function An(t,e){return{eventTime:t,lane:e,tag:0,payload:null,callback:null,next:null}}function cr(t,e,n){var r=t.updateQueue;if(r===null)return null;if(r=r.shared,de&2){var i=r.pending;return i===null?e.next=e:(e.next=i.next,i.next=e),r.pending=e,xn(t,n)}return i=r.interleaved,i===null?(e.next=e,Dd(r)):(e.next=i.next,i.next=e),r.interleaved=e,xn(t,n)}function Xa(t,e,n){if(e=e.updateQueue,e!==null&&(e=e.shared,(n&4194240)!==0)){var r=e.lanes;r&=t.pendingLanes,n|=r,e.lanes=n,_d(t,n)}}function xm(t,e){var n=t.updateQueue,r=t.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,s=null;if(n=n.firstBaseUpdate,n!==null){do{var o={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};s===null?i=s=o:s=s.next=o,n=n.next}while(n!==null);s===null?i=s=e:s=s.next=e}else i=s=e;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:s,shared:r.shared,effects:r.effects},t.updateQueue=n;return}t=n.lastBaseUpdate,t===null?n.firstBaseUpdate=e:t.next=e,n.lastBaseUpdate=e}function Pl(t,e,n,r){var i=t.updateQueue;Yn=!1;var s=i.firstBaseUpdate,o=i.lastBaseUpdate,l=i.shared.pending;if(l!==null){i.shared.pending=null;var u=l,h=u.next;u.next=null,o===null?s=h:o.next=h,o=u;var p=t.alternate;p!==null&&(p=p.updateQueue,l=p.lastBaseUpdate,l!==o&&(l===null?p.firstBaseUpdate=h:l.next=h,p.lastBaseUpdate=u))}if(s!==null){var m=i.baseState;o=0,p=h=u=null,l=s;do{var g=l.lane,_=l.eventTime;if((r&g)===g){p!==null&&(p=p.next={eventTime:_,lane:0,tag:l.tag,payload:l.payload,callback:l.callback,next:null});e:{var N=t,R=l;switch(g=e,_=n,R.tag){case 1:if(N=R.payload,typeof N=="function"){m=N.call(_,m,g);break e}m=N;break e;case 3:N.flags=N.flags&-65537|128;case 0:if(N=R.payload,g=typeof N=="function"?N.call(_,m,g):N,g==null)break e;m=ke({},m,g);break e;case 2:Yn=!0}}l.callback!==null&&l.lane!==0&&(t.flags|=64,g=i.effects,g===null?i.effects=[l]:g.push(l))}else _={eventTime:_,lane:g,tag:l.tag,payload:l.payload,callback:l.callback,next:null},p===null?(h=p=_,u=m):p=p.next=_,o|=g;if(l=l.next,l===null){if(l=i.shared.pending,l===null)break;g=l,l=g.next,g.next=null,i.lastBaseUpdate=g,i.shared.pending=null}}while(!0);if(p===null&&(u=m),i.baseState=u,i.firstBaseUpdate=h,i.lastBaseUpdate=p,e=i.shared.interleaved,e!==null){i=e;do o|=i.lane,i=i.next;while(i!==e)}else s===null&&(i.shared.lanes=0);Zr|=o,t.lanes=o,t.memoizedState=m}}function bm(t,e,n){if(t=e.effects,e.effects=null,t!==null)for(e=0;e<t.length;e++){var r=t[e],i=r.callback;if(i!==null){if(r.callback=null,r=n,typeof i!="function")throw Error(B(191,i));i.call(r)}}}var Ko={},un=Nr(Ko),ko=Nr(Ko),Po=Nr(Ko);function Hr(t){if(t===Ko)throw Error(B(174));return t}function Od(t,e){switch(ye(Po,e),ye(ko,t),ye(un,Ko),t=e.nodeType,t){case 9:case 11:e=(e=e.documentElement)?e.namespaceURI:eh(null,"");break;default:t=t===8?e.parentNode:e,e=t.namespaceURI||null,t=t.tagName,e=eh(e,t)}Ie(un),ye(un,e)}function Xi(){Ie(un),Ie(ko),Ie(Po)}function Kv(t){Hr(Po.current);var e=Hr(un.current),n=eh(e,t.type);e!==n&&(ye(ko,t),ye(un,n))}function Ld(t){ko.current===t&&(Ie(un),Ie(ko))}var Ce=Nr(0);function Nl(t){for(var e=t;e!==null;){if(e.tag===13){var n=e.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return e}else if(e.tag===19&&e.memoizedProps.revealOrder!==void 0){if(e.flags&128)return e}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return null;e=e.return}e.sibling.return=e.return,e=e.sibling}return null}var Ac=[];function Md(){for(var t=0;t<Ac.length;t++)Ac[t]._workInProgressVersionPrimary=null;Ac.length=0}var Ja=Mn.ReactCurrentDispatcher,Cc=Mn.ReactCurrentBatchConfig,Jr=0,Re=null,Ue=null,He=null,xl=!1,ao=!1,No=0,BI=0;function rt(){throw Error(B(321))}function Fd(t,e){if(e===null)return!1;for(var n=0;n<e.length&&n<t.length;n++)if(!Zt(t[n],e[n]))return!1;return!0}function Ud(t,e,n,r,i,s){if(Jr=s,Re=e,e.memoizedState=null,e.updateQueue=null,e.lanes=0,Ja.current=t===null||t.memoizedState===null?HI:qI,t=n(r,i),ao){s=0;do{if(ao=!1,No=0,25<=s)throw Error(B(301));s+=1,He=Ue=null,e.updateQueue=null,Ja.current=GI,t=n(r,i)}while(ao)}if(Ja.current=bl,e=Ue!==null&&Ue.next!==null,Jr=0,He=Ue=Re=null,xl=!1,e)throw Error(B(300));return t}function zd(){var t=No!==0;return No=0,t}function sn(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return He===null?Re.memoizedState=He=t:He=He.next=t,He}function jt(){if(Ue===null){var t=Re.alternate;t=t!==null?t.memoizedState:null}else t=Ue.next;var e=He===null?Re.memoizedState:He.next;if(e!==null)He=e,Ue=t;else{if(t===null)throw Error(B(310));Ue=t,t={memoizedState:Ue.memoizedState,baseState:Ue.baseState,baseQueue:Ue.baseQueue,queue:Ue.queue,next:null},He===null?Re.memoizedState=He=t:He=He.next=t}return He}function xo(t,e){return typeof e=="function"?e(t):e}function Rc(t){var e=jt(),n=e.queue;if(n===null)throw Error(B(311));n.lastRenderedReducer=t;var r=Ue,i=r.baseQueue,s=n.pending;if(s!==null){if(i!==null){var o=i.next;i.next=s.next,s.next=o}r.baseQueue=i=s,n.pending=null}if(i!==null){s=i.next,r=r.baseState;var l=o=null,u=null,h=s;do{var p=h.lane;if((Jr&p)===p)u!==null&&(u=u.next={lane:0,action:h.action,hasEagerState:h.hasEagerState,eagerState:h.eagerState,next:null}),r=h.hasEagerState?h.eagerState:t(r,h.action);else{var m={lane:p,action:h.action,hasEagerState:h.hasEagerState,eagerState:h.eagerState,next:null};u===null?(l=u=m,o=r):u=u.next=m,Re.lanes|=p,Zr|=p}h=h.next}while(h!==null&&h!==s);u===null?o=r:u.next=l,Zt(r,e.memoizedState)||(Tt=!0),e.memoizedState=r,e.baseState=o,e.baseQueue=u,n.lastRenderedState=r}if(t=n.interleaved,t!==null){i=t;do s=i.lane,Re.lanes|=s,Zr|=s,i=i.next;while(i!==t)}else i===null&&(n.lanes=0);return[e.memoizedState,n.dispatch]}function kc(t){var e=jt(),n=e.queue;if(n===null)throw Error(B(311));n.lastRenderedReducer=t;var r=n.dispatch,i=n.pending,s=e.memoizedState;if(i!==null){n.pending=null;var o=i=i.next;do s=t(s,o.action),o=o.next;while(o!==i);Zt(s,e.memoizedState)||(Tt=!0),e.memoizedState=s,e.baseQueue===null&&(e.baseState=s),n.lastRenderedState=s}return[s,r]}function Qv(){}function Yv(t,e){var n=Re,r=jt(),i=e(),s=!Zt(r.memoizedState,i);if(s&&(r.memoizedState=i,Tt=!0),r=r.queue,Bd(Zv.bind(null,n,r,t),[t]),r.getSnapshot!==e||s||He!==null&&He.memoizedState.tag&1){if(n.flags|=2048,bo(9,Jv.bind(null,n,r,i,e),void 0,null),qe===null)throw Error(B(349));Jr&30||Xv(n,e,i)}return i}function Xv(t,e,n){t.flags|=16384,t={getSnapshot:e,value:n},e=Re.updateQueue,e===null?(e={lastEffect:null,stores:null},Re.updateQueue=e,e.stores=[t]):(n=e.stores,n===null?e.stores=[t]:n.push(t))}function Jv(t,e,n,r){e.value=n,e.getSnapshot=r,e_(e)&&t_(t)}function Zv(t,e,n){return n(function(){e_(e)&&t_(t)})}function e_(t){var e=t.getSnapshot;t=t.value;try{var n=e();return!Zt(t,n)}catch{return!0}}function t_(t){var e=xn(t,1);e!==null&&Yt(e,t,1,-1)}function Dm(t){var e=sn();return typeof t=="function"&&(t=t()),e.memoizedState=e.baseState=t,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:xo,lastRenderedState:t},e.queue=t,t=t.dispatch=WI.bind(null,Re,t),[e.memoizedState,t]}function bo(t,e,n,r){return t={tag:t,create:e,destroy:n,deps:r,next:null},e=Re.updateQueue,e===null?(e={lastEffect:null,stores:null},Re.updateQueue=e,e.lastEffect=t.next=t):(n=e.lastEffect,n===null?e.lastEffect=t.next=t:(r=n.next,n.next=t,t.next=r,e.lastEffect=t)),t}function n_(){return jt().memoizedState}function Za(t,e,n,r){var i=sn();Re.flags|=t,i.memoizedState=bo(1|e,n,void 0,r===void 0?null:r)}function hu(t,e,n,r){var i=jt();r=r===void 0?null:r;var s=void 0;if(Ue!==null){var o=Ue.memoizedState;if(s=o.destroy,r!==null&&Fd(r,o.deps)){i.memoizedState=bo(e,n,s,r);return}}Re.flags|=t,i.memoizedState=bo(1|e,n,s,r)}function Vm(t,e){return Za(8390656,8,t,e)}function Bd(t,e){return hu(2048,8,t,e)}function r_(t,e){return hu(4,2,t,e)}function i_(t,e){return hu(4,4,t,e)}function s_(t,e){if(typeof e=="function")return t=t(),e(t),function(){e(null)};if(e!=null)return t=t(),e.current=t,function(){e.current=null}}function o_(t,e,n){return n=n!=null?n.concat([t]):null,hu(4,4,s_.bind(null,e,t),n)}function jd(){}function a_(t,e){var n=jt();e=e===void 0?null:e;var r=n.memoizedState;return r!==null&&e!==null&&Fd(e,r[1])?r[0]:(n.memoizedState=[t,e],t)}function l_(t,e){var n=jt();e=e===void 0?null:e;var r=n.memoizedState;return r!==null&&e!==null&&Fd(e,r[1])?r[0]:(t=t(),n.memoizedState=[t,e],t)}function u_(t,e,n){return Jr&21?(Zt(n,e)||(n=pv(),Re.lanes|=n,Zr|=n,t.baseState=!0),e):(t.baseState&&(t.baseState=!1,Tt=!0),t.memoizedState=n)}function jI(t,e){var n=pe;pe=n!==0&&4>n?n:4,t(!0);var r=Cc.transition;Cc.transition={};try{t(!1),e()}finally{pe=n,Cc.transition=r}}function c_(){return jt().memoizedState}function $I(t,e,n){var r=dr(t);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},h_(t))d_(e,n);else if(n=qv(t,e,n,r),n!==null){var i=mt();Yt(n,t,r,i),f_(n,e,r)}}function WI(t,e,n){var r=dr(t),i={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(h_(t))d_(e,i);else{var s=t.alternate;if(t.lanes===0&&(s===null||s.lanes===0)&&(s=e.lastRenderedReducer,s!==null))try{var o=e.lastRenderedState,l=s(o,n);if(i.hasEagerState=!0,i.eagerState=l,Zt(l,o)){var u=e.interleaved;u===null?(i.next=i,Dd(e)):(i.next=u.next,u.next=i),e.interleaved=i;return}}catch{}finally{}n=qv(t,e,i,r),n!==null&&(i=mt(),Yt(n,t,r,i),f_(n,e,r))}}function h_(t){var e=t.alternate;return t===Re||e!==null&&e===Re}function d_(t,e){ao=xl=!0;var n=t.pending;n===null?e.next=e:(e.next=n.next,n.next=e),t.pending=e}function f_(t,e,n){if(n&4194240){var r=e.lanes;r&=t.pendingLanes,n|=r,e.lanes=n,_d(t,n)}}var bl={readContext:Bt,useCallback:rt,useContext:rt,useEffect:rt,useImperativeHandle:rt,useInsertionEffect:rt,useLayoutEffect:rt,useMemo:rt,useReducer:rt,useRef:rt,useState:rt,useDebugValue:rt,useDeferredValue:rt,useTransition:rt,useMutableSource:rt,useSyncExternalStore:rt,useId:rt,unstable_isNewReconciler:!1},HI={readContext:Bt,useCallback:function(t,e){return sn().memoizedState=[t,e===void 0?null:e],t},useContext:Bt,useEffect:Vm,useImperativeHandle:function(t,e,n){return n=n!=null?n.concat([t]):null,Za(4194308,4,s_.bind(null,e,t),n)},useLayoutEffect:function(t,e){return Za(4194308,4,t,e)},useInsertionEffect:function(t,e){return Za(4,2,t,e)},useMemo:function(t,e){var n=sn();return e=e===void 0?null:e,t=t(),n.memoizedState=[t,e],t},useReducer:function(t,e,n){var r=sn();return e=n!==void 0?n(e):e,r.memoizedState=r.baseState=e,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:e},r.queue=t,t=t.dispatch=$I.bind(null,Re,t),[r.memoizedState,t]},useRef:function(t){var e=sn();return t={current:t},e.memoizedState=t},useState:Dm,useDebugValue:jd,useDeferredValue:function(t){return sn().memoizedState=t},useTransition:function(){var t=Dm(!1),e=t[0];return t=jI.bind(null,t[1]),sn().memoizedState=t,[e,t]},useMutableSource:function(){},useSyncExternalStore:function(t,e,n){var r=Re,i=sn();if(Ae){if(n===void 0)throw Error(B(407));n=n()}else{if(n=e(),qe===null)throw Error(B(349));Jr&30||Xv(r,e,n)}i.memoizedState=n;var s={value:n,getSnapshot:e};return i.queue=s,Vm(Zv.bind(null,r,s,t),[t]),r.flags|=2048,bo(9,Jv.bind(null,r,s,n,e),void 0,null),n},useId:function(){var t=sn(),e=qe.identifierPrefix;if(Ae){var n=wn,r=En;n=(r&~(1<<32-Qt(r)-1)).toString(32)+n,e=":"+e+"R"+n,n=No++,0<n&&(e+="H"+n.toString(32)),e+=":"}else n=BI++,e=":"+e+"r"+n.toString(32)+":";return t.memoizedState=e},unstable_isNewReconciler:!1},qI={readContext:Bt,useCallback:a_,useContext:Bt,useEffect:Bd,useImperativeHandle:o_,useInsertionEffect:r_,useLayoutEffect:i_,useMemo:l_,useReducer:Rc,useRef:n_,useState:function(){return Rc(xo)},useDebugValue:jd,useDeferredValue:function(t){var e=jt();return u_(e,Ue.memoizedState,t)},useTransition:function(){var t=Rc(xo)[0],e=jt().memoizedState;return[t,e]},useMutableSource:Qv,useSyncExternalStore:Yv,useId:c_,unstable_isNewReconciler:!1},GI={readContext:Bt,useCallback:a_,useContext:Bt,useEffect:Bd,useImperativeHandle:o_,useInsertionEffect:r_,useLayoutEffect:i_,useMemo:l_,useReducer:kc,useRef:n_,useState:function(){return kc(xo)},useDebugValue:jd,useDeferredValue:function(t){var e=jt();return Ue===null?e.memoizedState=t:u_(e,Ue.memoizedState,t)},useTransition:function(){var t=kc(xo)[0],e=jt().memoizedState;return[t,e]},useMutableSource:Qv,useSyncExternalStore:Yv,useId:c_,unstable_isNewReconciler:!1};function Ht(t,e){if(t&&t.defaultProps){e=ke({},e),t=t.defaultProps;for(var n in t)e[n]===void 0&&(e[n]=t[n]);return e}return e}function wh(t,e,n,r){e=t.memoizedState,n=n(r,e),n=n==null?e:ke({},e,n),t.memoizedState=n,t.lanes===0&&(t.updateQueue.baseState=n)}var du={isMounted:function(t){return(t=t._reactInternals)?ui(t)===t:!1},enqueueSetState:function(t,e,n){t=t._reactInternals;var r=mt(),i=dr(t),s=An(r,i);s.payload=e,n!=null&&(s.callback=n),e=cr(t,s,i),e!==null&&(Yt(e,t,i,r),Xa(e,t,i))},enqueueReplaceState:function(t,e,n){t=t._reactInternals;var r=mt(),i=dr(t),s=An(r,i);s.tag=1,s.payload=e,n!=null&&(s.callback=n),e=cr(t,s,i),e!==null&&(Yt(e,t,i,r),Xa(e,t,i))},enqueueForceUpdate:function(t,e){t=t._reactInternals;var n=mt(),r=dr(t),i=An(n,r);i.tag=2,e!=null&&(i.callback=e),e=cr(t,i,r),e!==null&&(Yt(e,t,r,n),Xa(e,t,r))}};function Om(t,e,n,r,i,s,o){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(r,s,o):e.prototype&&e.prototype.isPureReactComponent?!So(n,r)||!So(i,s):!0}function p_(t,e,n){var r=!1,i=wr,s=e.contextType;return typeof s=="object"&&s!==null?s=Bt(s):(i=St(e)?Yr:ut.current,r=e.contextTypes,s=(r=r!=null)?Ki(t,i):wr),e=new e(n,s),t.memoizedState=e.state!==null&&e.state!==void 0?e.state:null,e.updater=du,t.stateNode=e,e._reactInternals=t,r&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=i,t.__reactInternalMemoizedMaskedChildContext=s),e}function Lm(t,e,n,r){t=e.state,typeof e.componentWillReceiveProps=="function"&&e.componentWillReceiveProps(n,r),typeof e.UNSAFE_componentWillReceiveProps=="function"&&e.UNSAFE_componentWillReceiveProps(n,r),e.state!==t&&du.enqueueReplaceState(e,e.state,null)}function Th(t,e,n,r){var i=t.stateNode;i.props=n,i.state=t.memoizedState,i.refs={},Vd(t);var s=e.contextType;typeof s=="object"&&s!==null?i.context=Bt(s):(s=St(e)?Yr:ut.current,i.context=Ki(t,s)),i.state=t.memoizedState,s=e.getDerivedStateFromProps,typeof s=="function"&&(wh(t,e,s,n),i.state=t.memoizedState),typeof e.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(e=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),e!==i.state&&du.enqueueReplaceState(i,i.state,null),Pl(t,n,i,r),i.state=t.memoizedState),typeof i.componentDidMount=="function"&&(t.flags|=4194308)}function Ji(t,e){try{var n="",r=e;do n+=w0(r),r=r.return;while(r);var i=n}catch(s){i=`
Error generating stack: `+s.message+`
`+s.stack}return{value:t,source:e,stack:i,digest:null}}function Pc(t,e,n){return{value:t,source:null,stack:n??null,digest:e??null}}function Ih(t,e){try{console.error(e.value)}catch(n){setTimeout(function(){throw n})}}var KI=typeof WeakMap=="function"?WeakMap:Map;function m_(t,e,n){n=An(-1,n),n.tag=3,n.payload={element:null};var r=e.value;return n.callback=function(){Vl||(Vl=!0,Dh=r),Ih(t,e)},n}function g_(t,e,n){n=An(-1,n),n.tag=3;var r=t.type.getDerivedStateFromError;if(typeof r=="function"){var i=e.value;n.payload=function(){return r(i)},n.callback=function(){Ih(t,e)}}var s=t.stateNode;return s!==null&&typeof s.componentDidCatch=="function"&&(n.callback=function(){Ih(t,e),typeof r!="function"&&(hr===null?hr=new Set([this]):hr.add(this));var o=e.stack;this.componentDidCatch(e.value,{componentStack:o!==null?o:""})}),n}function Mm(t,e,n){var r=t.pingCache;if(r===null){r=t.pingCache=new KI;var i=new Set;r.set(e,i)}else i=r.get(e),i===void 0&&(i=new Set,r.set(e,i));i.has(n)||(i.add(n),t=lS.bind(null,t,e,n),e.then(t,t))}function Fm(t){do{var e;if((e=t.tag===13)&&(e=t.memoizedState,e=e!==null?e.dehydrated!==null:!0),e)return t;t=t.return}while(t!==null);return null}function Um(t,e,n,r,i){return t.mode&1?(t.flags|=65536,t.lanes=i,t):(t===e?t.flags|=65536:(t.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(e=An(-1,1),e.tag=2,cr(n,e,1))),n.lanes|=1),t)}var QI=Mn.ReactCurrentOwner,Tt=!1;function pt(t,e,n,r){e.child=t===null?Hv(e,null,n,r):Yi(e,t.child,n,r)}function zm(t,e,n,r,i){n=n.render;var s=e.ref;return Ui(e,i),r=Ud(t,e,n,r,s,i),n=zd(),t!==null&&!Tt?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~i,bn(t,e,i)):(Ae&&n&&Rd(e),e.flags|=1,pt(t,e,r,i),e.child)}function Bm(t,e,n,r,i){if(t===null){var s=n.type;return typeof s=="function"&&!Yd(s)&&s.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(e.tag=15,e.type=s,y_(t,e,s,r,i)):(t=rl(n.type,null,r,e,e.mode,i),t.ref=e.ref,t.return=e,e.child=t)}if(s=t.child,!(t.lanes&i)){var o=s.memoizedProps;if(n=n.compare,n=n!==null?n:So,n(o,r)&&t.ref===e.ref)return bn(t,e,i)}return e.flags|=1,t=fr(s,r),t.ref=e.ref,t.return=e,e.child=t}function y_(t,e,n,r,i){if(t!==null){var s=t.memoizedProps;if(So(s,r)&&t.ref===e.ref)if(Tt=!1,e.pendingProps=r=s,(t.lanes&i)!==0)t.flags&131072&&(Tt=!0);else return e.lanes=t.lanes,bn(t,e,i)}return Sh(t,e,n,r,i)}function v_(t,e,n){var r=e.pendingProps,i=r.children,s=t!==null?t.memoizedState:null;if(r.mode==="hidden")if(!(e.mode&1))e.memoizedState={baseLanes:0,cachePool:null,transitions:null},ye(bi,Rt),Rt|=n;else{if(!(n&1073741824))return t=s!==null?s.baseLanes|n:n,e.lanes=e.childLanes=1073741824,e.memoizedState={baseLanes:t,cachePool:null,transitions:null},e.updateQueue=null,ye(bi,Rt),Rt|=t,null;e.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=s!==null?s.baseLanes:n,ye(bi,Rt),Rt|=r}else s!==null?(r=s.baseLanes|n,e.memoizedState=null):r=n,ye(bi,Rt),Rt|=r;return pt(t,e,i,n),e.child}function __(t,e){var n=e.ref;(t===null&&n!==null||t!==null&&t.ref!==n)&&(e.flags|=512,e.flags|=2097152)}function Sh(t,e,n,r,i){var s=St(n)?Yr:ut.current;return s=Ki(e,s),Ui(e,i),n=Ud(t,e,n,r,s,i),r=zd(),t!==null&&!Tt?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~i,bn(t,e,i)):(Ae&&r&&Rd(e),e.flags|=1,pt(t,e,n,i),e.child)}function jm(t,e,n,r,i){if(St(n)){var s=!0;Sl(e)}else s=!1;if(Ui(e,i),e.stateNode===null)el(t,e),p_(e,n,r),Th(e,n,r,i),r=!0;else if(t===null){var o=e.stateNode,l=e.memoizedProps;o.props=l;var u=o.context,h=n.contextType;typeof h=="object"&&h!==null?h=Bt(h):(h=St(n)?Yr:ut.current,h=Ki(e,h));var p=n.getDerivedStateFromProps,m=typeof p=="function"||typeof o.getSnapshotBeforeUpdate=="function";m||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(l!==r||u!==h)&&Lm(e,o,r,h),Yn=!1;var g=e.memoizedState;o.state=g,Pl(e,r,o,i),u=e.memoizedState,l!==r||g!==u||It.current||Yn?(typeof p=="function"&&(wh(e,n,p,r),u=e.memoizedState),(l=Yn||Om(e,n,l,r,g,u,h))?(m||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(e.flags|=4194308)):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),e.memoizedProps=r,e.memoizedState=u),o.props=r,o.state=u,o.context=h,r=l):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),r=!1)}else{o=e.stateNode,Gv(t,e),l=e.memoizedProps,h=e.type===e.elementType?l:Ht(e.type,l),o.props=h,m=e.pendingProps,g=o.context,u=n.contextType,typeof u=="object"&&u!==null?u=Bt(u):(u=St(n)?Yr:ut.current,u=Ki(e,u));var _=n.getDerivedStateFromProps;(p=typeof _=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(l!==m||g!==u)&&Lm(e,o,r,u),Yn=!1,g=e.memoizedState,o.state=g,Pl(e,r,o,i);var N=e.memoizedState;l!==m||g!==N||It.current||Yn?(typeof _=="function"&&(wh(e,n,_,r),N=e.memoizedState),(h=Yn||Om(e,n,h,r,g,N,u)||!1)?(p||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(r,N,u),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(r,N,u)),typeof o.componentDidUpdate=="function"&&(e.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(e.flags|=1024)):(typeof o.componentDidUpdate!="function"||l===t.memoizedProps&&g===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||l===t.memoizedProps&&g===t.memoizedState||(e.flags|=1024),e.memoizedProps=r,e.memoizedState=N),o.props=r,o.state=N,o.context=u,r=h):(typeof o.componentDidUpdate!="function"||l===t.memoizedProps&&g===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||l===t.memoizedProps&&g===t.memoizedState||(e.flags|=1024),r=!1)}return Ah(t,e,n,r,s,i)}function Ah(t,e,n,r,i,s){__(t,e);var o=(e.flags&128)!==0;if(!r&&!o)return i&&Rm(e,n,!1),bn(t,e,s);r=e.stateNode,QI.current=e;var l=o&&typeof n.getDerivedStateFromError!="function"?null:r.render();return e.flags|=1,t!==null&&o?(e.child=Yi(e,t.child,null,s),e.child=Yi(e,null,l,s)):pt(t,e,l,s),e.memoizedState=r.state,i&&Rm(e,n,!0),e.child}function E_(t){var e=t.stateNode;e.pendingContext?Cm(t,e.pendingContext,e.pendingContext!==e.context):e.context&&Cm(t,e.context,!1),Od(t,e.containerInfo)}function $m(t,e,n,r,i){return Qi(),Pd(i),e.flags|=256,pt(t,e,n,r),e.child}var Ch={dehydrated:null,treeContext:null,retryLane:0};function Rh(t){return{baseLanes:t,cachePool:null,transitions:null}}function w_(t,e,n){var r=e.pendingProps,i=Ce.current,s=!1,o=(e.flags&128)!==0,l;if((l=o)||(l=t!==null&&t.memoizedState===null?!1:(i&2)!==0),l?(s=!0,e.flags&=-129):(t===null||t.memoizedState!==null)&&(i|=1),ye(Ce,i&1),t===null)return _h(e),t=e.memoizedState,t!==null&&(t=t.dehydrated,t!==null)?(e.mode&1?t.data==="$!"?e.lanes=8:e.lanes=1073741824:e.lanes=1,null):(o=r.children,t=r.fallback,s?(r=e.mode,s=e.child,o={mode:"hidden",children:o},!(r&1)&&s!==null?(s.childLanes=0,s.pendingProps=o):s=mu(o,r,0,null),t=Kr(t,r,n,null),s.return=e,t.return=e,s.sibling=t,e.child=s,e.child.memoizedState=Rh(n),e.memoizedState=Ch,t):$d(e,o));if(i=t.memoizedState,i!==null&&(l=i.dehydrated,l!==null))return YI(t,e,o,r,l,i,n);if(s){s=r.fallback,o=e.mode,i=t.child,l=i.sibling;var u={mode:"hidden",children:r.children};return!(o&1)&&e.child!==i?(r=e.child,r.childLanes=0,r.pendingProps=u,e.deletions=null):(r=fr(i,u),r.subtreeFlags=i.subtreeFlags&14680064),l!==null?s=fr(l,s):(s=Kr(s,o,n,null),s.flags|=2),s.return=e,r.return=e,r.sibling=s,e.child=r,r=s,s=e.child,o=t.child.memoizedState,o=o===null?Rh(n):{baseLanes:o.baseLanes|n,cachePool:null,transitions:o.transitions},s.memoizedState=o,s.childLanes=t.childLanes&~n,e.memoizedState=Ch,r}return s=t.child,t=s.sibling,r=fr(s,{mode:"visible",children:r.children}),!(e.mode&1)&&(r.lanes=n),r.return=e,r.sibling=null,t!==null&&(n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)),e.child=r,e.memoizedState=null,r}function $d(t,e){return e=mu({mode:"visible",children:e},t.mode,0,null),e.return=t,t.child=e}function Va(t,e,n,r){return r!==null&&Pd(r),Yi(e,t.child,null,n),t=$d(e,e.pendingProps.children),t.flags|=2,e.memoizedState=null,t}function YI(t,e,n,r,i,s,o){if(n)return e.flags&256?(e.flags&=-257,r=Pc(Error(B(422))),Va(t,e,o,r)):e.memoizedState!==null?(e.child=t.child,e.flags|=128,null):(s=r.fallback,i=e.mode,r=mu({mode:"visible",children:r.children},i,0,null),s=Kr(s,i,o,null),s.flags|=2,r.return=e,s.return=e,r.sibling=s,e.child=r,e.mode&1&&Yi(e,t.child,null,o),e.child.memoizedState=Rh(o),e.memoizedState=Ch,s);if(!(e.mode&1))return Va(t,e,o,null);if(i.data==="$!"){if(r=i.nextSibling&&i.nextSibling.dataset,r)var l=r.dgst;return r=l,s=Error(B(419)),r=Pc(s,r,void 0),Va(t,e,o,r)}if(l=(o&t.childLanes)!==0,Tt||l){if(r=qe,r!==null){switch(o&-o){case 4:i=2;break;case 16:i=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:i=32;break;case 536870912:i=268435456;break;default:i=0}i=i&(r.suspendedLanes|o)?0:i,i!==0&&i!==s.retryLane&&(s.retryLane=i,xn(t,i),Yt(r,t,i,-1))}return Qd(),r=Pc(Error(B(421))),Va(t,e,o,r)}return i.data==="$?"?(e.flags|=128,e.child=t.child,e=uS.bind(null,t),i._reactRetry=e,null):(t=s.treeContext,kt=ur(i.nextSibling),Nt=e,Ae=!0,Gt=null,t!==null&&(Ot[Lt++]=En,Ot[Lt++]=wn,Ot[Lt++]=Xr,En=t.id,wn=t.overflow,Xr=e),e=$d(e,r.children),e.flags|=4096,e)}function Wm(t,e,n){t.lanes|=e;var r=t.alternate;r!==null&&(r.lanes|=e),Eh(t.return,e,n)}function Nc(t,e,n,r,i){var s=t.memoizedState;s===null?t.memoizedState={isBackwards:e,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i}:(s.isBackwards=e,s.rendering=null,s.renderingStartTime=0,s.last=r,s.tail=n,s.tailMode=i)}function T_(t,e,n){var r=e.pendingProps,i=r.revealOrder,s=r.tail;if(pt(t,e,r.children,n),r=Ce.current,r&2)r=r&1|2,e.flags|=128;else{if(t!==null&&t.flags&128)e:for(t=e.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Wm(t,n,e);else if(t.tag===19)Wm(t,n,e);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;t=t.return}t.sibling.return=t.return,t=t.sibling}r&=1}if(ye(Ce,r),!(e.mode&1))e.memoizedState=null;else switch(i){case"forwards":for(n=e.child,i=null;n!==null;)t=n.alternate,t!==null&&Nl(t)===null&&(i=n),n=n.sibling;n=i,n===null?(i=e.child,e.child=null):(i=n.sibling,n.sibling=null),Nc(e,!1,i,n,s);break;case"backwards":for(n=null,i=e.child,e.child=null;i!==null;){if(t=i.alternate,t!==null&&Nl(t)===null){e.child=i;break}t=i.sibling,i.sibling=n,n=i,i=t}Nc(e,!0,n,null,s);break;case"together":Nc(e,!1,null,null,void 0);break;default:e.memoizedState=null}return e.child}function el(t,e){!(e.mode&1)&&t!==null&&(t.alternate=null,e.alternate=null,e.flags|=2)}function bn(t,e,n){if(t!==null&&(e.dependencies=t.dependencies),Zr|=e.lanes,!(n&e.childLanes))return null;if(t!==null&&e.child!==t.child)throw Error(B(153));if(e.child!==null){for(t=e.child,n=fr(t,t.pendingProps),e.child=n,n.return=e;t.sibling!==null;)t=t.sibling,n=n.sibling=fr(t,t.pendingProps),n.return=e;n.sibling=null}return e.child}function XI(t,e,n){switch(e.tag){case 3:E_(e),Qi();break;case 5:Kv(e);break;case 1:St(e.type)&&Sl(e);break;case 4:Od(e,e.stateNode.containerInfo);break;case 10:var r=e.type._context,i=e.memoizedProps.value;ye(Rl,r._currentValue),r._currentValue=i;break;case 13:if(r=e.memoizedState,r!==null)return r.dehydrated!==null?(ye(Ce,Ce.current&1),e.flags|=128,null):n&e.child.childLanes?w_(t,e,n):(ye(Ce,Ce.current&1),t=bn(t,e,n),t!==null?t.sibling:null);ye(Ce,Ce.current&1);break;case 19:if(r=(n&e.childLanes)!==0,t.flags&128){if(r)return T_(t,e,n);e.flags|=128}if(i=e.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),ye(Ce,Ce.current),r)break;return null;case 22:case 23:return e.lanes=0,v_(t,e,n)}return bn(t,e,n)}var I_,kh,S_,A_;I_=function(t,e){for(var n=e.child;n!==null;){if(n.tag===5||n.tag===6)t.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};kh=function(){};S_=function(t,e,n,r){var i=t.memoizedProps;if(i!==r){t=e.stateNode,Hr(un.current);var s=null;switch(n){case"input":i=Yc(t,i),r=Yc(t,r),s=[];break;case"select":i=ke({},i,{value:void 0}),r=ke({},r,{value:void 0}),s=[];break;case"textarea":i=Zc(t,i),r=Zc(t,r),s=[];break;default:typeof i.onClick!="function"&&typeof r.onClick=="function"&&(t.onclick=Tl)}th(n,r);var o;n=null;for(h in i)if(!r.hasOwnProperty(h)&&i.hasOwnProperty(h)&&i[h]!=null)if(h==="style"){var l=i[h];for(o in l)l.hasOwnProperty(o)&&(n||(n={}),n[o]="")}else h!=="dangerouslySetInnerHTML"&&h!=="children"&&h!=="suppressContentEditableWarning"&&h!=="suppressHydrationWarning"&&h!=="autoFocus"&&(yo.hasOwnProperty(h)?s||(s=[]):(s=s||[]).push(h,null));for(h in r){var u=r[h];if(l=i!=null?i[h]:void 0,r.hasOwnProperty(h)&&u!==l&&(u!=null||l!=null))if(h==="style")if(l){for(o in l)!l.hasOwnProperty(o)||u&&u.hasOwnProperty(o)||(n||(n={}),n[o]="");for(o in u)u.hasOwnProperty(o)&&l[o]!==u[o]&&(n||(n={}),n[o]=u[o])}else n||(s||(s=[]),s.push(h,n)),n=u;else h==="dangerouslySetInnerHTML"?(u=u?u.__html:void 0,l=l?l.__html:void 0,u!=null&&l!==u&&(s=s||[]).push(h,u)):h==="children"?typeof u!="string"&&typeof u!="number"||(s=s||[]).push(h,""+u):h!=="suppressContentEditableWarning"&&h!=="suppressHydrationWarning"&&(yo.hasOwnProperty(h)?(u!=null&&h==="onScroll"&&Ee("scroll",t),s||l===u||(s=[])):(s=s||[]).push(h,u))}n&&(s=s||[]).push("style",n);var h=s;(e.updateQueue=h)&&(e.flags|=4)}};A_=function(t,e,n,r){n!==r&&(e.flags|=4)};function js(t,e){if(!Ae)switch(t.tailMode){case"hidden":e=t.tail;for(var n=null;e!==null;)e.alternate!==null&&(n=e),e=e.sibling;n===null?t.tail=null:n.sibling=null;break;case"collapsed":n=t.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?e||t.tail===null?t.tail=null:t.tail.sibling=null:r.sibling=null}}function it(t){var e=t.alternate!==null&&t.alternate.child===t.child,n=0,r=0;if(e)for(var i=t.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&14680064,r|=i.flags&14680064,i.return=t,i=i.sibling;else for(i=t.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=t,i=i.sibling;return t.subtreeFlags|=r,t.childLanes=n,e}function JI(t,e,n){var r=e.pendingProps;switch(kd(e),e.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return it(e),null;case 1:return St(e.type)&&Il(),it(e),null;case 3:return r=e.stateNode,Xi(),Ie(It),Ie(ut),Md(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(t===null||t.child===null)&&(ba(e)?e.flags|=4:t===null||t.memoizedState.isDehydrated&&!(e.flags&256)||(e.flags|=1024,Gt!==null&&(Lh(Gt),Gt=null))),kh(t,e),it(e),null;case 5:Ld(e);var i=Hr(Po.current);if(n=e.type,t!==null&&e.stateNode!=null)S_(t,e,n,r,i),t.ref!==e.ref&&(e.flags|=512,e.flags|=2097152);else{if(!r){if(e.stateNode===null)throw Error(B(166));return it(e),null}if(t=Hr(un.current),ba(e)){r=e.stateNode,n=e.type;var s=e.memoizedProps;switch(r[an]=e,r[Ro]=s,t=(e.mode&1)!==0,n){case"dialog":Ee("cancel",r),Ee("close",r);break;case"iframe":case"object":case"embed":Ee("load",r);break;case"video":case"audio":for(i=0;i<Qs.length;i++)Ee(Qs[i],r);break;case"source":Ee("error",r);break;case"img":case"image":case"link":Ee("error",r),Ee("load",r);break;case"details":Ee("toggle",r);break;case"input":Zp(r,s),Ee("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!s.multiple},Ee("invalid",r);break;case"textarea":tm(r,s),Ee("invalid",r)}th(n,s),i=null;for(var o in s)if(s.hasOwnProperty(o)){var l=s[o];o==="children"?typeof l=="string"?r.textContent!==l&&(s.suppressHydrationWarning!==!0&&xa(r.textContent,l,t),i=["children",l]):typeof l=="number"&&r.textContent!==""+l&&(s.suppressHydrationWarning!==!0&&xa(r.textContent,l,t),i=["children",""+l]):yo.hasOwnProperty(o)&&l!=null&&o==="onScroll"&&Ee("scroll",r)}switch(n){case"input":Ia(r),em(r,s,!0);break;case"textarea":Ia(r),nm(r);break;case"select":case"option":break;default:typeof s.onClick=="function"&&(r.onclick=Tl)}r=i,e.updateQueue=r,r!==null&&(e.flags|=4)}else{o=i.nodeType===9?i:i.ownerDocument,t==="http://www.w3.org/1999/xhtml"&&(t=Zy(n)),t==="http://www.w3.org/1999/xhtml"?n==="script"?(t=o.createElement("div"),t.innerHTML="<script><\/script>",t=t.removeChild(t.firstChild)):typeof r.is=="string"?t=o.createElement(n,{is:r.is}):(t=o.createElement(n),n==="select"&&(o=t,r.multiple?o.multiple=!0:r.size&&(o.size=r.size))):t=o.createElementNS(t,n),t[an]=e,t[Ro]=r,I_(t,e,!1,!1),e.stateNode=t;e:{switch(o=nh(n,r),n){case"dialog":Ee("cancel",t),Ee("close",t),i=r;break;case"iframe":case"object":case"embed":Ee("load",t),i=r;break;case"video":case"audio":for(i=0;i<Qs.length;i++)Ee(Qs[i],t);i=r;break;case"source":Ee("error",t),i=r;break;case"img":case"image":case"link":Ee("error",t),Ee("load",t),i=r;break;case"details":Ee("toggle",t),i=r;break;case"input":Zp(t,r),i=Yc(t,r),Ee("invalid",t);break;case"option":i=r;break;case"select":t._wrapperState={wasMultiple:!!r.multiple},i=ke({},r,{value:void 0}),Ee("invalid",t);break;case"textarea":tm(t,r),i=Zc(t,r),Ee("invalid",t);break;default:i=r}th(n,i),l=i;for(s in l)if(l.hasOwnProperty(s)){var u=l[s];s==="style"?nv(t,u):s==="dangerouslySetInnerHTML"?(u=u?u.__html:void 0,u!=null&&ev(t,u)):s==="children"?typeof u=="string"?(n!=="textarea"||u!=="")&&vo(t,u):typeof u=="number"&&vo(t,""+u):s!=="suppressContentEditableWarning"&&s!=="suppressHydrationWarning"&&s!=="autoFocus"&&(yo.hasOwnProperty(s)?u!=null&&s==="onScroll"&&Ee("scroll",t):u!=null&&fd(t,s,u,o))}switch(n){case"input":Ia(t),em(t,r,!1);break;case"textarea":Ia(t),nm(t);break;case"option":r.value!=null&&t.setAttribute("value",""+Er(r.value));break;case"select":t.multiple=!!r.multiple,s=r.value,s!=null?Oi(t,!!r.multiple,s,!1):r.defaultValue!=null&&Oi(t,!!r.multiple,r.defaultValue,!0);break;default:typeof i.onClick=="function"&&(t.onclick=Tl)}switch(n){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(e.flags|=4)}e.ref!==null&&(e.flags|=512,e.flags|=2097152)}return it(e),null;case 6:if(t&&e.stateNode!=null)A_(t,e,t.memoizedProps,r);else{if(typeof r!="string"&&e.stateNode===null)throw Error(B(166));if(n=Hr(Po.current),Hr(un.current),ba(e)){if(r=e.stateNode,n=e.memoizedProps,r[an]=e,(s=r.nodeValue!==n)&&(t=Nt,t!==null))switch(t.tag){case 3:xa(r.nodeValue,n,(t.mode&1)!==0);break;case 5:t.memoizedProps.suppressHydrationWarning!==!0&&xa(r.nodeValue,n,(t.mode&1)!==0)}s&&(e.flags|=4)}else r=(n.nodeType===9?n:n.ownerDocument).createTextNode(r),r[an]=e,e.stateNode=r}return it(e),null;case 13:if(Ie(Ce),r=e.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(Ae&&kt!==null&&e.mode&1&&!(e.flags&128))$v(),Qi(),e.flags|=98560,s=!1;else if(s=ba(e),r!==null&&r.dehydrated!==null){if(t===null){if(!s)throw Error(B(318));if(s=e.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(B(317));s[an]=e}else Qi(),!(e.flags&128)&&(e.memoizedState=null),e.flags|=4;it(e),s=!1}else Gt!==null&&(Lh(Gt),Gt=null),s=!0;if(!s)return e.flags&65536?e:null}return e.flags&128?(e.lanes=n,e):(r=r!==null,r!==(t!==null&&t.memoizedState!==null)&&r&&(e.child.flags|=8192,e.mode&1&&(t===null||Ce.current&1?Be===0&&(Be=3):Qd())),e.updateQueue!==null&&(e.flags|=4),it(e),null);case 4:return Xi(),kh(t,e),t===null&&Ao(e.stateNode.containerInfo),it(e),null;case 10:return bd(e.type._context),it(e),null;case 17:return St(e.type)&&Il(),it(e),null;case 19:if(Ie(Ce),s=e.memoizedState,s===null)return it(e),null;if(r=(e.flags&128)!==0,o=s.rendering,o===null)if(r)js(s,!1);else{if(Be!==0||t!==null&&t.flags&128)for(t=e.child;t!==null;){if(o=Nl(t),o!==null){for(e.flags|=128,js(s,!1),r=o.updateQueue,r!==null&&(e.updateQueue=r,e.flags|=4),e.subtreeFlags=0,r=n,n=e.child;n!==null;)s=n,t=r,s.flags&=14680066,o=s.alternate,o===null?(s.childLanes=0,s.lanes=t,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=o.childLanes,s.lanes=o.lanes,s.child=o.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=o.memoizedProps,s.memoizedState=o.memoizedState,s.updateQueue=o.updateQueue,s.type=o.type,t=o.dependencies,s.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),n=n.sibling;return ye(Ce,Ce.current&1|2),e.child}t=t.sibling}s.tail!==null&&De()>Zi&&(e.flags|=128,r=!0,js(s,!1),e.lanes=4194304)}else{if(!r)if(t=Nl(o),t!==null){if(e.flags|=128,r=!0,n=t.updateQueue,n!==null&&(e.updateQueue=n,e.flags|=4),js(s,!0),s.tail===null&&s.tailMode==="hidden"&&!o.alternate&&!Ae)return it(e),null}else 2*De()-s.renderingStartTime>Zi&&n!==1073741824&&(e.flags|=128,r=!0,js(s,!1),e.lanes=4194304);s.isBackwards?(o.sibling=e.child,e.child=o):(n=s.last,n!==null?n.sibling=o:e.child=o,s.last=o)}return s.tail!==null?(e=s.tail,s.rendering=e,s.tail=e.sibling,s.renderingStartTime=De(),e.sibling=null,n=Ce.current,ye(Ce,r?n&1|2:n&1),e):(it(e),null);case 22:case 23:return Kd(),r=e.memoizedState!==null,t!==null&&t.memoizedState!==null!==r&&(e.flags|=8192),r&&e.mode&1?Rt&1073741824&&(it(e),e.subtreeFlags&6&&(e.flags|=8192)):it(e),null;case 24:return null;case 25:return null}throw Error(B(156,e.tag))}function ZI(t,e){switch(kd(e),e.tag){case 1:return St(e.type)&&Il(),t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 3:return Xi(),Ie(It),Ie(ut),Md(),t=e.flags,t&65536&&!(t&128)?(e.flags=t&-65537|128,e):null;case 5:return Ld(e),null;case 13:if(Ie(Ce),t=e.memoizedState,t!==null&&t.dehydrated!==null){if(e.alternate===null)throw Error(B(340));Qi()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 19:return Ie(Ce),null;case 4:return Xi(),null;case 10:return bd(e.type._context),null;case 22:case 23:return Kd(),null;case 24:return null;default:return null}}var Oa=!1,at=!1,eS=typeof WeakSet=="function"?WeakSet:Set,G=null;function xi(t,e){var n=t.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(r){xe(t,e,r)}else n.current=null}function Ph(t,e,n){try{n()}catch(r){xe(t,e,r)}}var Hm=!1;function tS(t,e){if(dh=_l,t=Nv(),Cd(t)){if("selectionStart"in t)var n={start:t.selectionStart,end:t.selectionEnd};else e:{n=(n=t.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var i=r.anchorOffset,s=r.focusNode;r=r.focusOffset;try{n.nodeType,s.nodeType}catch{n=null;break e}var o=0,l=-1,u=-1,h=0,p=0,m=t,g=null;t:for(;;){for(var _;m!==n||i!==0&&m.nodeType!==3||(l=o+i),m!==s||r!==0&&m.nodeType!==3||(u=o+r),m.nodeType===3&&(o+=m.nodeValue.length),(_=m.firstChild)!==null;)g=m,m=_;for(;;){if(m===t)break t;if(g===n&&++h===i&&(l=o),g===s&&++p===r&&(u=o),(_=m.nextSibling)!==null)break;m=g,g=m.parentNode}m=_}n=l===-1||u===-1?null:{start:l,end:u}}else n=null}n=n||{start:0,end:0}}else n=null;for(fh={focusedElem:t,selectionRange:n},_l=!1,G=e;G!==null;)if(e=G,t=e.child,(e.subtreeFlags&1028)!==0&&t!==null)t.return=e,G=t;else for(;G!==null;){e=G;try{var N=e.alternate;if(e.flags&1024)switch(e.tag){case 0:case 11:case 15:break;case 1:if(N!==null){var R=N.memoizedProps,k=N.memoizedState,I=e.stateNode,T=I.getSnapshotBeforeUpdate(e.elementType===e.type?R:Ht(e.type,R),k);I.__reactInternalSnapshotBeforeUpdate=T}break;case 3:var P=e.stateNode.containerInfo;P.nodeType===1?P.textContent="":P.nodeType===9&&P.documentElement&&P.removeChild(P.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(B(163))}}catch(b){xe(e,e.return,b)}if(t=e.sibling,t!==null){t.return=e.return,G=t;break}G=e.return}return N=Hm,Hm=!1,N}function lo(t,e,n){var r=e.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var i=r=r.next;do{if((i.tag&t)===t){var s=i.destroy;i.destroy=void 0,s!==void 0&&Ph(e,n,s)}i=i.next}while(i!==r)}}function fu(t,e){if(e=e.updateQueue,e=e!==null?e.lastEffect:null,e!==null){var n=e=e.next;do{if((n.tag&t)===t){var r=n.create;n.destroy=r()}n=n.next}while(n!==e)}}function Nh(t){var e=t.ref;if(e!==null){var n=t.stateNode;switch(t.tag){case 5:t=n;break;default:t=n}typeof e=="function"?e(t):e.current=t}}function C_(t){var e=t.alternate;e!==null&&(t.alternate=null,C_(e)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(e=t.stateNode,e!==null&&(delete e[an],delete e[Ro],delete e[gh],delete e[MI],delete e[FI])),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}function R_(t){return t.tag===5||t.tag===3||t.tag===4}function qm(t){e:for(;;){for(;t.sibling===null;){if(t.return===null||R_(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.flags&2||t.child===null||t.tag===4)continue e;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function xh(t,e,n){var r=t.tag;if(r===5||r===6)t=t.stateNode,e?n.nodeType===8?n.parentNode.insertBefore(t,e):n.insertBefore(t,e):(n.nodeType===8?(e=n.parentNode,e.insertBefore(t,n)):(e=n,e.appendChild(t)),n=n._reactRootContainer,n!=null||e.onclick!==null||(e.onclick=Tl));else if(r!==4&&(t=t.child,t!==null))for(xh(t,e,n),t=t.sibling;t!==null;)xh(t,e,n),t=t.sibling}function bh(t,e,n){var r=t.tag;if(r===5||r===6)t=t.stateNode,e?n.insertBefore(t,e):n.appendChild(t);else if(r!==4&&(t=t.child,t!==null))for(bh(t,e,n),t=t.sibling;t!==null;)bh(t,e,n),t=t.sibling}var Ke=null,qt=!1;function Gn(t,e,n){for(n=n.child;n!==null;)k_(t,e,n),n=n.sibling}function k_(t,e,n){if(ln&&typeof ln.onCommitFiberUnmount=="function")try{ln.onCommitFiberUnmount(su,n)}catch{}switch(n.tag){case 5:at||xi(n,e);case 6:var r=Ke,i=qt;Ke=null,Gn(t,e,n),Ke=r,qt=i,Ke!==null&&(qt?(t=Ke,n=n.stateNode,t.nodeType===8?t.parentNode.removeChild(n):t.removeChild(n)):Ke.removeChild(n.stateNode));break;case 18:Ke!==null&&(qt?(t=Ke,n=n.stateNode,t.nodeType===8?Ic(t.parentNode,n):t.nodeType===1&&Ic(t,n),To(t)):Ic(Ke,n.stateNode));break;case 4:r=Ke,i=qt,Ke=n.stateNode.containerInfo,qt=!0,Gn(t,e,n),Ke=r,qt=i;break;case 0:case 11:case 14:case 15:if(!at&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){i=r=r.next;do{var s=i,o=s.destroy;s=s.tag,o!==void 0&&(s&2||s&4)&&Ph(n,e,o),i=i.next}while(i!==r)}Gn(t,e,n);break;case 1:if(!at&&(xi(n,e),r=n.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(l){xe(n,e,l)}Gn(t,e,n);break;case 21:Gn(t,e,n);break;case 22:n.mode&1?(at=(r=at)||n.memoizedState!==null,Gn(t,e,n),at=r):Gn(t,e,n);break;default:Gn(t,e,n)}}function Gm(t){var e=t.updateQueue;if(e!==null){t.updateQueue=null;var n=t.stateNode;n===null&&(n=t.stateNode=new eS),e.forEach(function(r){var i=cS.bind(null,t,r);n.has(r)||(n.add(r),r.then(i,i))})}}function $t(t,e){var n=e.deletions;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];try{var s=t,o=e,l=o;e:for(;l!==null;){switch(l.tag){case 5:Ke=l.stateNode,qt=!1;break e;case 3:Ke=l.stateNode.containerInfo,qt=!0;break e;case 4:Ke=l.stateNode.containerInfo,qt=!0;break e}l=l.return}if(Ke===null)throw Error(B(160));k_(s,o,i),Ke=null,qt=!1;var u=i.alternate;u!==null&&(u.return=null),i.return=null}catch(h){xe(i,e,h)}}if(e.subtreeFlags&12854)for(e=e.child;e!==null;)P_(e,t),e=e.sibling}function P_(t,e){var n=t.alternate,r=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if($t(e,t),rn(t),r&4){try{lo(3,t,t.return),fu(3,t)}catch(R){xe(t,t.return,R)}try{lo(5,t,t.return)}catch(R){xe(t,t.return,R)}}break;case 1:$t(e,t),rn(t),r&512&&n!==null&&xi(n,n.return);break;case 5:if($t(e,t),rn(t),r&512&&n!==null&&xi(n,n.return),t.flags&32){var i=t.stateNode;try{vo(i,"")}catch(R){xe(t,t.return,R)}}if(r&4&&(i=t.stateNode,i!=null)){var s=t.memoizedProps,o=n!==null?n.memoizedProps:s,l=t.type,u=t.updateQueue;if(t.updateQueue=null,u!==null)try{l==="input"&&s.type==="radio"&&s.name!=null&&Xy(i,s),nh(l,o);var h=nh(l,s);for(o=0;o<u.length;o+=2){var p=u[o],m=u[o+1];p==="style"?nv(i,m):p==="dangerouslySetInnerHTML"?ev(i,m):p==="children"?vo(i,m):fd(i,p,m,h)}switch(l){case"input":Xc(i,s);break;case"textarea":Jy(i,s);break;case"select":var g=i._wrapperState.wasMultiple;i._wrapperState.wasMultiple=!!s.multiple;var _=s.value;_!=null?Oi(i,!!s.multiple,_,!1):g!==!!s.multiple&&(s.defaultValue!=null?Oi(i,!!s.multiple,s.defaultValue,!0):Oi(i,!!s.multiple,s.multiple?[]:"",!1))}i[Ro]=s}catch(R){xe(t,t.return,R)}}break;case 6:if($t(e,t),rn(t),r&4){if(t.stateNode===null)throw Error(B(162));i=t.stateNode,s=t.memoizedProps;try{i.nodeValue=s}catch(R){xe(t,t.return,R)}}break;case 3:if($t(e,t),rn(t),r&4&&n!==null&&n.memoizedState.isDehydrated)try{To(e.containerInfo)}catch(R){xe(t,t.return,R)}break;case 4:$t(e,t),rn(t);break;case 13:$t(e,t),rn(t),i=t.child,i.flags&8192&&(s=i.memoizedState!==null,i.stateNode.isHidden=s,!s||i.alternate!==null&&i.alternate.memoizedState!==null||(qd=De())),r&4&&Gm(t);break;case 22:if(p=n!==null&&n.memoizedState!==null,t.mode&1?(at=(h=at)||p,$t(e,t),at=h):$t(e,t),rn(t),r&8192){if(h=t.memoizedState!==null,(t.stateNode.isHidden=h)&&!p&&t.mode&1)for(G=t,p=t.child;p!==null;){for(m=G=p;G!==null;){switch(g=G,_=g.child,g.tag){case 0:case 11:case 14:case 15:lo(4,g,g.return);break;case 1:xi(g,g.return);var N=g.stateNode;if(typeof N.componentWillUnmount=="function"){r=g,n=g.return;try{e=r,N.props=e.memoizedProps,N.state=e.memoizedState,N.componentWillUnmount()}catch(R){xe(r,n,R)}}break;case 5:xi(g,g.return);break;case 22:if(g.memoizedState!==null){Qm(m);continue}}_!==null?(_.return=g,G=_):Qm(m)}p=p.sibling}e:for(p=null,m=t;;){if(m.tag===5){if(p===null){p=m;try{i=m.stateNode,h?(s=i.style,typeof s.setProperty=="function"?s.setProperty("display","none","important"):s.display="none"):(l=m.stateNode,u=m.memoizedProps.style,o=u!=null&&u.hasOwnProperty("display")?u.display:null,l.style.display=tv("display",o))}catch(R){xe(t,t.return,R)}}}else if(m.tag===6){if(p===null)try{m.stateNode.nodeValue=h?"":m.memoizedProps}catch(R){xe(t,t.return,R)}}else if((m.tag!==22&&m.tag!==23||m.memoizedState===null||m===t)&&m.child!==null){m.child.return=m,m=m.child;continue}if(m===t)break e;for(;m.sibling===null;){if(m.return===null||m.return===t)break e;p===m&&(p=null),m=m.return}p===m&&(p=null),m.sibling.return=m.return,m=m.sibling}}break;case 19:$t(e,t),rn(t),r&4&&Gm(t);break;case 21:break;default:$t(e,t),rn(t)}}function rn(t){var e=t.flags;if(e&2){try{e:{for(var n=t.return;n!==null;){if(R_(n)){var r=n;break e}n=n.return}throw Error(B(160))}switch(r.tag){case 5:var i=r.stateNode;r.flags&32&&(vo(i,""),r.flags&=-33);var s=qm(t);bh(t,s,i);break;case 3:case 4:var o=r.stateNode.containerInfo,l=qm(t);xh(t,l,o);break;default:throw Error(B(161))}}catch(u){xe(t,t.return,u)}t.flags&=-3}e&4096&&(t.flags&=-4097)}function nS(t,e,n){G=t,N_(t)}function N_(t,e,n){for(var r=(t.mode&1)!==0;G!==null;){var i=G,s=i.child;if(i.tag===22&&r){var o=i.memoizedState!==null||Oa;if(!o){var l=i.alternate,u=l!==null&&l.memoizedState!==null||at;l=Oa;var h=at;if(Oa=o,(at=u)&&!h)for(G=i;G!==null;)o=G,u=o.child,o.tag===22&&o.memoizedState!==null?Ym(i):u!==null?(u.return=o,G=u):Ym(i);for(;s!==null;)G=s,N_(s),s=s.sibling;G=i,Oa=l,at=h}Km(t)}else i.subtreeFlags&8772&&s!==null?(s.return=i,G=s):Km(t)}}function Km(t){for(;G!==null;){var e=G;if(e.flags&8772){var n=e.alternate;try{if(e.flags&8772)switch(e.tag){case 0:case 11:case 15:at||fu(5,e);break;case 1:var r=e.stateNode;if(e.flags&4&&!at)if(n===null)r.componentDidMount();else{var i=e.elementType===e.type?n.memoizedProps:Ht(e.type,n.memoizedProps);r.componentDidUpdate(i,n.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var s=e.updateQueue;s!==null&&bm(e,s,r);break;case 3:var o=e.updateQueue;if(o!==null){if(n=null,e.child!==null)switch(e.child.tag){case 5:n=e.child.stateNode;break;case 1:n=e.child.stateNode}bm(e,o,n)}break;case 5:var l=e.stateNode;if(n===null&&e.flags&4){n=l;var u=e.memoizedProps;switch(e.type){case"button":case"input":case"select":case"textarea":u.autoFocus&&n.focus();break;case"img":u.src&&(n.src=u.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(e.memoizedState===null){var h=e.alternate;if(h!==null){var p=h.memoizedState;if(p!==null){var m=p.dehydrated;m!==null&&To(m)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(B(163))}at||e.flags&512&&Nh(e)}catch(g){xe(e,e.return,g)}}if(e===t){G=null;break}if(n=e.sibling,n!==null){n.return=e.return,G=n;break}G=e.return}}function Qm(t){for(;G!==null;){var e=G;if(e===t){G=null;break}var n=e.sibling;if(n!==null){n.return=e.return,G=n;break}G=e.return}}function Ym(t){for(;G!==null;){var e=G;try{switch(e.tag){case 0:case 11:case 15:var n=e.return;try{fu(4,e)}catch(u){xe(e,n,u)}break;case 1:var r=e.stateNode;if(typeof r.componentDidMount=="function"){var i=e.return;try{r.componentDidMount()}catch(u){xe(e,i,u)}}var s=e.return;try{Nh(e)}catch(u){xe(e,s,u)}break;case 5:var o=e.return;try{Nh(e)}catch(u){xe(e,o,u)}}}catch(u){xe(e,e.return,u)}if(e===t){G=null;break}var l=e.sibling;if(l!==null){l.return=e.return,G=l;break}G=e.return}}var rS=Math.ceil,Dl=Mn.ReactCurrentDispatcher,Wd=Mn.ReactCurrentOwner,zt=Mn.ReactCurrentBatchConfig,de=0,qe=null,Oe=null,Xe=0,Rt=0,bi=Nr(0),Be=0,Do=null,Zr=0,pu=0,Hd=0,uo=null,Et=null,qd=0,Zi=1/0,vn=null,Vl=!1,Dh=null,hr=null,La=!1,ir=null,Ol=0,co=0,Vh=null,tl=-1,nl=0;function mt(){return de&6?De():tl!==-1?tl:tl=De()}function dr(t){return t.mode&1?de&2&&Xe!==0?Xe&-Xe:zI.transition!==null?(nl===0&&(nl=pv()),nl):(t=pe,t!==0||(t=window.event,t=t===void 0?16:wv(t.type)),t):1}function Yt(t,e,n,r){if(50<co)throw co=0,Vh=null,Error(B(185));Ho(t,n,r),(!(de&2)||t!==qe)&&(t===qe&&(!(de&2)&&(pu|=n),Be===4&&Jn(t,Xe)),At(t,r),n===1&&de===0&&!(e.mode&1)&&(Zi=De()+500,cu&&xr()))}function At(t,e){var n=t.callbackNode;z0(t,e);var r=vl(t,t===qe?Xe:0);if(r===0)n!==null&&sm(n),t.callbackNode=null,t.callbackPriority=0;else if(e=r&-r,t.callbackPriority!==e){if(n!=null&&sm(n),e===1)t.tag===0?UI(Xm.bind(null,t)):zv(Xm.bind(null,t)),OI(function(){!(de&6)&&xr()}),n=null;else{switch(mv(r)){case 1:n=vd;break;case 4:n=dv;break;case 16:n=yl;break;case 536870912:n=fv;break;default:n=yl}n=F_(n,x_.bind(null,t))}t.callbackPriority=e,t.callbackNode=n}}function x_(t,e){if(tl=-1,nl=0,de&6)throw Error(B(327));var n=t.callbackNode;if(zi()&&t.callbackNode!==n)return null;var r=vl(t,t===qe?Xe:0);if(r===0)return null;if(r&30||r&t.expiredLanes||e)e=Ll(t,r);else{e=r;var i=de;de|=2;var s=D_();(qe!==t||Xe!==e)&&(vn=null,Zi=De()+500,Gr(t,e));do try{oS();break}catch(l){b_(t,l)}while(!0);xd(),Dl.current=s,de=i,Oe!==null?e=0:(qe=null,Xe=0,e=Be)}if(e!==0){if(e===2&&(i=ah(t),i!==0&&(r=i,e=Oh(t,i))),e===1)throw n=Do,Gr(t,0),Jn(t,r),At(t,De()),n;if(e===6)Jn(t,r);else{if(i=t.current.alternate,!(r&30)&&!iS(i)&&(e=Ll(t,r),e===2&&(s=ah(t),s!==0&&(r=s,e=Oh(t,s))),e===1))throw n=Do,Gr(t,0),Jn(t,r),At(t,De()),n;switch(t.finishedWork=i,t.finishedLanes=r,e){case 0:case 1:throw Error(B(345));case 2:Br(t,Et,vn);break;case 3:if(Jn(t,r),(r&130023424)===r&&(e=qd+500-De(),10<e)){if(vl(t,0)!==0)break;if(i=t.suspendedLanes,(i&r)!==r){mt(),t.pingedLanes|=t.suspendedLanes&i;break}t.timeoutHandle=mh(Br.bind(null,t,Et,vn),e);break}Br(t,Et,vn);break;case 4:if(Jn(t,r),(r&4194240)===r)break;for(e=t.eventTimes,i=-1;0<r;){var o=31-Qt(r);s=1<<o,o=e[o],o>i&&(i=o),r&=~s}if(r=i,r=De()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*rS(r/1960))-r,10<r){t.timeoutHandle=mh(Br.bind(null,t,Et,vn),r);break}Br(t,Et,vn);break;case 5:Br(t,Et,vn);break;default:throw Error(B(329))}}}return At(t,De()),t.callbackNode===n?x_.bind(null,t):null}function Oh(t,e){var n=uo;return t.current.memoizedState.isDehydrated&&(Gr(t,e).flags|=256),t=Ll(t,e),t!==2&&(e=Et,Et=n,e!==null&&Lh(e)),t}function Lh(t){Et===null?Et=t:Et.push.apply(Et,t)}function iS(t){for(var e=t;;){if(e.flags&16384){var n=e.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var i=n[r],s=i.getSnapshot;i=i.value;try{if(!Zt(s(),i))return!1}catch{return!1}}}if(n=e.child,e.subtreeFlags&16384&&n!==null)n.return=e,e=n;else{if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return!0;e=e.return}e.sibling.return=e.return,e=e.sibling}}return!0}function Jn(t,e){for(e&=~Hd,e&=~pu,t.suspendedLanes|=e,t.pingedLanes&=~e,t=t.expirationTimes;0<e;){var n=31-Qt(e),r=1<<n;t[n]=-1,e&=~r}}function Xm(t){if(de&6)throw Error(B(327));zi();var e=vl(t,0);if(!(e&1))return At(t,De()),null;var n=Ll(t,e);if(t.tag!==0&&n===2){var r=ah(t);r!==0&&(e=r,n=Oh(t,r))}if(n===1)throw n=Do,Gr(t,0),Jn(t,e),At(t,De()),n;if(n===6)throw Error(B(345));return t.finishedWork=t.current.alternate,t.finishedLanes=e,Br(t,Et,vn),At(t,De()),null}function Gd(t,e){var n=de;de|=1;try{return t(e)}finally{de=n,de===0&&(Zi=De()+500,cu&&xr())}}function ei(t){ir!==null&&ir.tag===0&&!(de&6)&&zi();var e=de;de|=1;var n=zt.transition,r=pe;try{if(zt.transition=null,pe=1,t)return t()}finally{pe=r,zt.transition=n,de=e,!(de&6)&&xr()}}function Kd(){Rt=bi.current,Ie(bi)}function Gr(t,e){t.finishedWork=null,t.finishedLanes=0;var n=t.timeoutHandle;if(n!==-1&&(t.timeoutHandle=-1,VI(n)),Oe!==null)for(n=Oe.return;n!==null;){var r=n;switch(kd(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Il();break;case 3:Xi(),Ie(It),Ie(ut),Md();break;case 5:Ld(r);break;case 4:Xi();break;case 13:Ie(Ce);break;case 19:Ie(Ce);break;case 10:bd(r.type._context);break;case 22:case 23:Kd()}n=n.return}if(qe=t,Oe=t=fr(t.current,null),Xe=Rt=e,Be=0,Do=null,Hd=pu=Zr=0,Et=uo=null,Wr!==null){for(e=0;e<Wr.length;e++)if(n=Wr[e],r=n.interleaved,r!==null){n.interleaved=null;var i=r.next,s=n.pending;if(s!==null){var o=s.next;s.next=i,r.next=o}n.pending=r}Wr=null}return t}function b_(t,e){do{var n=Oe;try{if(xd(),Ja.current=bl,xl){for(var r=Re.memoizedState;r!==null;){var i=r.queue;i!==null&&(i.pending=null),r=r.next}xl=!1}if(Jr=0,He=Ue=Re=null,ao=!1,No=0,Wd.current=null,n===null||n.return===null){Be=1,Do=e,Oe=null;break}e:{var s=t,o=n.return,l=n,u=e;if(e=Xe,l.flags|=32768,u!==null&&typeof u=="object"&&typeof u.then=="function"){var h=u,p=l,m=p.tag;if(!(p.mode&1)&&(m===0||m===11||m===15)){var g=p.alternate;g?(p.updateQueue=g.updateQueue,p.memoizedState=g.memoizedState,p.lanes=g.lanes):(p.updateQueue=null,p.memoizedState=null)}var _=Fm(o);if(_!==null){_.flags&=-257,Um(_,o,l,s,e),_.mode&1&&Mm(s,h,e),e=_,u=h;var N=e.updateQueue;if(N===null){var R=new Set;R.add(u),e.updateQueue=R}else N.add(u);break e}else{if(!(e&1)){Mm(s,h,e),Qd();break e}u=Error(B(426))}}else if(Ae&&l.mode&1){var k=Fm(o);if(k!==null){!(k.flags&65536)&&(k.flags|=256),Um(k,o,l,s,e),Pd(Ji(u,l));break e}}s=u=Ji(u,l),Be!==4&&(Be=2),uo===null?uo=[s]:uo.push(s),s=o;do{switch(s.tag){case 3:s.flags|=65536,e&=-e,s.lanes|=e;var I=m_(s,u,e);xm(s,I);break e;case 1:l=u;var T=s.type,P=s.stateNode;if(!(s.flags&128)&&(typeof T.getDerivedStateFromError=="function"||P!==null&&typeof P.componentDidCatch=="function"&&(hr===null||!hr.has(P)))){s.flags|=65536,e&=-e,s.lanes|=e;var b=g_(s,l,e);xm(s,b);break e}}s=s.return}while(s!==null)}O_(n)}catch(V){e=V,Oe===n&&n!==null&&(Oe=n=n.return);continue}break}while(!0)}function D_(){var t=Dl.current;return Dl.current=bl,t===null?bl:t}function Qd(){(Be===0||Be===3||Be===2)&&(Be=4),qe===null||!(Zr&268435455)&&!(pu&268435455)||Jn(qe,Xe)}function Ll(t,e){var n=de;de|=2;var r=D_();(qe!==t||Xe!==e)&&(vn=null,Gr(t,e));do try{sS();break}catch(i){b_(t,i)}while(!0);if(xd(),de=n,Dl.current=r,Oe!==null)throw Error(B(261));return qe=null,Xe=0,Be}function sS(){for(;Oe!==null;)V_(Oe)}function oS(){for(;Oe!==null&&!x0();)V_(Oe)}function V_(t){var e=M_(t.alternate,t,Rt);t.memoizedProps=t.pendingProps,e===null?O_(t):Oe=e,Wd.current=null}function O_(t){var e=t;do{var n=e.alternate;if(t=e.return,e.flags&32768){if(n=ZI(n,e),n!==null){n.flags&=32767,Oe=n;return}if(t!==null)t.flags|=32768,t.subtreeFlags=0,t.deletions=null;else{Be=6,Oe=null;return}}else if(n=JI(n,e,Rt),n!==null){Oe=n;return}if(e=e.sibling,e!==null){Oe=e;return}Oe=e=t}while(e!==null);Be===0&&(Be=5)}function Br(t,e,n){var r=pe,i=zt.transition;try{zt.transition=null,pe=1,aS(t,e,n,r)}finally{zt.transition=i,pe=r}return null}function aS(t,e,n,r){do zi();while(ir!==null);if(de&6)throw Error(B(327));n=t.finishedWork;var i=t.finishedLanes;if(n===null)return null;if(t.finishedWork=null,t.finishedLanes=0,n===t.current)throw Error(B(177));t.callbackNode=null,t.callbackPriority=0;var s=n.lanes|n.childLanes;if(B0(t,s),t===qe&&(Oe=qe=null,Xe=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||La||(La=!0,F_(yl,function(){return zi(),null})),s=(n.flags&15990)!==0,n.subtreeFlags&15990||s){s=zt.transition,zt.transition=null;var o=pe;pe=1;var l=de;de|=4,Wd.current=null,tS(t,n),P_(n,t),RI(fh),_l=!!dh,fh=dh=null,t.current=n,nS(n),b0(),de=l,pe=o,zt.transition=s}else t.current=n;if(La&&(La=!1,ir=t,Ol=i),s=t.pendingLanes,s===0&&(hr=null),O0(n.stateNode),At(t,De()),e!==null)for(r=t.onRecoverableError,n=0;n<e.length;n++)i=e[n],r(i.value,{componentStack:i.stack,digest:i.digest});if(Vl)throw Vl=!1,t=Dh,Dh=null,t;return Ol&1&&t.tag!==0&&zi(),s=t.pendingLanes,s&1?t===Vh?co++:(co=0,Vh=t):co=0,xr(),null}function zi(){if(ir!==null){var t=mv(Ol),e=zt.transition,n=pe;try{if(zt.transition=null,pe=16>t?16:t,ir===null)var r=!1;else{if(t=ir,ir=null,Ol=0,de&6)throw Error(B(331));var i=de;for(de|=4,G=t.current;G!==null;){var s=G,o=s.child;if(G.flags&16){var l=s.deletions;if(l!==null){for(var u=0;u<l.length;u++){var h=l[u];for(G=h;G!==null;){var p=G;switch(p.tag){case 0:case 11:case 15:lo(8,p,s)}var m=p.child;if(m!==null)m.return=p,G=m;else for(;G!==null;){p=G;var g=p.sibling,_=p.return;if(C_(p),p===h){G=null;break}if(g!==null){g.return=_,G=g;break}G=_}}}var N=s.alternate;if(N!==null){var R=N.child;if(R!==null){N.child=null;do{var k=R.sibling;R.sibling=null,R=k}while(R!==null)}}G=s}}if(s.subtreeFlags&2064&&o!==null)o.return=s,G=o;else e:for(;G!==null;){if(s=G,s.flags&2048)switch(s.tag){case 0:case 11:case 15:lo(9,s,s.return)}var I=s.sibling;if(I!==null){I.return=s.return,G=I;break e}G=s.return}}var T=t.current;for(G=T;G!==null;){o=G;var P=o.child;if(o.subtreeFlags&2064&&P!==null)P.return=o,G=P;else e:for(o=T;G!==null;){if(l=G,l.flags&2048)try{switch(l.tag){case 0:case 11:case 15:fu(9,l)}}catch(V){xe(l,l.return,V)}if(l===o){G=null;break e}var b=l.sibling;if(b!==null){b.return=l.return,G=b;break e}G=l.return}}if(de=i,xr(),ln&&typeof ln.onPostCommitFiberRoot=="function")try{ln.onPostCommitFiberRoot(su,t)}catch{}r=!0}return r}finally{pe=n,zt.transition=e}}return!1}function Jm(t,e,n){e=Ji(n,e),e=m_(t,e,1),t=cr(t,e,1),e=mt(),t!==null&&(Ho(t,1,e),At(t,e))}function xe(t,e,n){if(t.tag===3)Jm(t,t,n);else for(;e!==null;){if(e.tag===3){Jm(e,t,n);break}else if(e.tag===1){var r=e.stateNode;if(typeof e.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(hr===null||!hr.has(r))){t=Ji(n,t),t=g_(e,t,1),e=cr(e,t,1),t=mt(),e!==null&&(Ho(e,1,t),At(e,t));break}}e=e.return}}function lS(t,e,n){var r=t.pingCache;r!==null&&r.delete(e),e=mt(),t.pingedLanes|=t.suspendedLanes&n,qe===t&&(Xe&n)===n&&(Be===4||Be===3&&(Xe&130023424)===Xe&&500>De()-qd?Gr(t,0):Hd|=n),At(t,e)}function L_(t,e){e===0&&(t.mode&1?(e=Ca,Ca<<=1,!(Ca&130023424)&&(Ca=4194304)):e=1);var n=mt();t=xn(t,e),t!==null&&(Ho(t,e,n),At(t,n))}function uS(t){var e=t.memoizedState,n=0;e!==null&&(n=e.retryLane),L_(t,n)}function cS(t,e){var n=0;switch(t.tag){case 13:var r=t.stateNode,i=t.memoizedState;i!==null&&(n=i.retryLane);break;case 19:r=t.stateNode;break;default:throw Error(B(314))}r!==null&&r.delete(e),L_(t,n)}var M_;M_=function(t,e,n){if(t!==null)if(t.memoizedProps!==e.pendingProps||It.current)Tt=!0;else{if(!(t.lanes&n)&&!(e.flags&128))return Tt=!1,XI(t,e,n);Tt=!!(t.flags&131072)}else Tt=!1,Ae&&e.flags&1048576&&Bv(e,Cl,e.index);switch(e.lanes=0,e.tag){case 2:var r=e.type;el(t,e),t=e.pendingProps;var i=Ki(e,ut.current);Ui(e,n),i=Ud(null,e,r,t,i,n);var s=zd();return e.flags|=1,typeof i=="object"&&i!==null&&typeof i.render=="function"&&i.$$typeof===void 0?(e.tag=1,e.memoizedState=null,e.updateQueue=null,St(r)?(s=!0,Sl(e)):s=!1,e.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,Vd(e),i.updater=du,e.stateNode=i,i._reactInternals=e,Th(e,r,t,n),e=Ah(null,e,r,!0,s,n)):(e.tag=0,Ae&&s&&Rd(e),pt(null,e,i,n),e=e.child),e;case 16:r=e.elementType;e:{switch(el(t,e),t=e.pendingProps,i=r._init,r=i(r._payload),e.type=r,i=e.tag=dS(r),t=Ht(r,t),i){case 0:e=Sh(null,e,r,t,n);break e;case 1:e=jm(null,e,r,t,n);break e;case 11:e=zm(null,e,r,t,n);break e;case 14:e=Bm(null,e,r,Ht(r.type,t),n);break e}throw Error(B(306,r,""))}return e;case 0:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:Ht(r,i),Sh(t,e,r,i,n);case 1:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:Ht(r,i),jm(t,e,r,i,n);case 3:e:{if(E_(e),t===null)throw Error(B(387));r=e.pendingProps,s=e.memoizedState,i=s.element,Gv(t,e),Pl(e,r,null,n);var o=e.memoizedState;if(r=o.element,s.isDehydrated)if(s={element:r,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},e.updateQueue.baseState=s,e.memoizedState=s,e.flags&256){i=Ji(Error(B(423)),e),e=$m(t,e,r,n,i);break e}else if(r!==i){i=Ji(Error(B(424)),e),e=$m(t,e,r,n,i);break e}else for(kt=ur(e.stateNode.containerInfo.firstChild),Nt=e,Ae=!0,Gt=null,n=Hv(e,null,r,n),e.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Qi(),r===i){e=bn(t,e,n);break e}pt(t,e,r,n)}e=e.child}return e;case 5:return Kv(e),t===null&&_h(e),r=e.type,i=e.pendingProps,s=t!==null?t.memoizedProps:null,o=i.children,ph(r,i)?o=null:s!==null&&ph(r,s)&&(e.flags|=32),__(t,e),pt(t,e,o,n),e.child;case 6:return t===null&&_h(e),null;case 13:return w_(t,e,n);case 4:return Od(e,e.stateNode.containerInfo),r=e.pendingProps,t===null?e.child=Yi(e,null,r,n):pt(t,e,r,n),e.child;case 11:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:Ht(r,i),zm(t,e,r,i,n);case 7:return pt(t,e,e.pendingProps,n),e.child;case 8:return pt(t,e,e.pendingProps.children,n),e.child;case 12:return pt(t,e,e.pendingProps.children,n),e.child;case 10:e:{if(r=e.type._context,i=e.pendingProps,s=e.memoizedProps,o=i.value,ye(Rl,r._currentValue),r._currentValue=o,s!==null)if(Zt(s.value,o)){if(s.children===i.children&&!It.current){e=bn(t,e,n);break e}}else for(s=e.child,s!==null&&(s.return=e);s!==null;){var l=s.dependencies;if(l!==null){o=s.child;for(var u=l.firstContext;u!==null;){if(u.context===r){if(s.tag===1){u=An(-1,n&-n),u.tag=2;var h=s.updateQueue;if(h!==null){h=h.shared;var p=h.pending;p===null?u.next=u:(u.next=p.next,p.next=u),h.pending=u}}s.lanes|=n,u=s.alternate,u!==null&&(u.lanes|=n),Eh(s.return,n,e),l.lanes|=n;break}u=u.next}}else if(s.tag===10)o=s.type===e.type?null:s.child;else if(s.tag===18){if(o=s.return,o===null)throw Error(B(341));o.lanes|=n,l=o.alternate,l!==null&&(l.lanes|=n),Eh(o,n,e),o=s.sibling}else o=s.child;if(o!==null)o.return=s;else for(o=s;o!==null;){if(o===e){o=null;break}if(s=o.sibling,s!==null){s.return=o.return,o=s;break}o=o.return}s=o}pt(t,e,i.children,n),e=e.child}return e;case 9:return i=e.type,r=e.pendingProps.children,Ui(e,n),i=Bt(i),r=r(i),e.flags|=1,pt(t,e,r,n),e.child;case 14:return r=e.type,i=Ht(r,e.pendingProps),i=Ht(r.type,i),Bm(t,e,r,i,n);case 15:return y_(t,e,e.type,e.pendingProps,n);case 17:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:Ht(r,i),el(t,e),e.tag=1,St(r)?(t=!0,Sl(e)):t=!1,Ui(e,n),p_(e,r,i),Th(e,r,i,n),Ah(null,e,r,!0,t,n);case 19:return T_(t,e,n);case 22:return v_(t,e,n)}throw Error(B(156,e.tag))};function F_(t,e){return hv(t,e)}function hS(t,e,n,r){this.tag=t,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=e,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Ut(t,e,n,r){return new hS(t,e,n,r)}function Yd(t){return t=t.prototype,!(!t||!t.isReactComponent)}function dS(t){if(typeof t=="function")return Yd(t)?1:0;if(t!=null){if(t=t.$$typeof,t===md)return 11;if(t===gd)return 14}return 2}function fr(t,e){var n=t.alternate;return n===null?(n=Ut(t.tag,e,t.key,t.mode),n.elementType=t.elementType,n.type=t.type,n.stateNode=t.stateNode,n.alternate=t,t.alternate=n):(n.pendingProps=e,n.type=t.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=t.flags&14680064,n.childLanes=t.childLanes,n.lanes=t.lanes,n.child=t.child,n.memoizedProps=t.memoizedProps,n.memoizedState=t.memoizedState,n.updateQueue=t.updateQueue,e=t.dependencies,n.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext},n.sibling=t.sibling,n.index=t.index,n.ref=t.ref,n}function rl(t,e,n,r,i,s){var o=2;if(r=t,typeof t=="function")Yd(t)&&(o=1);else if(typeof t=="string")o=5;else e:switch(t){case Ti:return Kr(n.children,i,s,e);case pd:o=8,i|=8;break;case qc:return t=Ut(12,n,e,i|2),t.elementType=qc,t.lanes=s,t;case Gc:return t=Ut(13,n,e,i),t.elementType=Gc,t.lanes=s,t;case Kc:return t=Ut(19,n,e,i),t.elementType=Kc,t.lanes=s,t;case Ky:return mu(n,i,s,e);default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case qy:o=10;break e;case Gy:o=9;break e;case md:o=11;break e;case gd:o=14;break e;case Qn:o=16,r=null;break e}throw Error(B(130,t==null?t:typeof t,""))}return e=Ut(o,n,e,i),e.elementType=t,e.type=r,e.lanes=s,e}function Kr(t,e,n,r){return t=Ut(7,t,r,e),t.lanes=n,t}function mu(t,e,n,r){return t=Ut(22,t,r,e),t.elementType=Ky,t.lanes=n,t.stateNode={isHidden:!1},t}function xc(t,e,n){return t=Ut(6,t,null,e),t.lanes=n,t}function bc(t,e,n){return e=Ut(4,t.children!==null?t.children:[],t.key,e),e.lanes=n,e.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},e}function fS(t,e,n,r,i){this.tag=e,this.containerInfo=t,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=dc(0),this.expirationTimes=dc(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=dc(0),this.identifierPrefix=r,this.onRecoverableError=i,this.mutableSourceEagerHydrationData=null}function Xd(t,e,n,r,i,s,o,l,u){return t=new fS(t,e,n,l,u),e===1?(e=1,s===!0&&(e|=8)):e=0,s=Ut(3,null,null,e),t.current=s,s.stateNode=t,s.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},Vd(s),t}function pS(t,e,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:wi,key:r==null?null:""+r,children:t,containerInfo:e,implementation:n}}function U_(t){if(!t)return wr;t=t._reactInternals;e:{if(ui(t)!==t||t.tag!==1)throw Error(B(170));var e=t;do{switch(e.tag){case 3:e=e.stateNode.context;break e;case 1:if(St(e.type)){e=e.stateNode.__reactInternalMemoizedMergedChildContext;break e}}e=e.return}while(e!==null);throw Error(B(171))}if(t.tag===1){var n=t.type;if(St(n))return Uv(t,n,e)}return e}function z_(t,e,n,r,i,s,o,l,u){return t=Xd(n,r,!0,t,i,s,o,l,u),t.context=U_(null),n=t.current,r=mt(),i=dr(n),s=An(r,i),s.callback=e??null,cr(n,s,i),t.current.lanes=i,Ho(t,i,r),At(t,r),t}function gu(t,e,n,r){var i=e.current,s=mt(),o=dr(i);return n=U_(n),e.context===null?e.context=n:e.pendingContext=n,e=An(s,o),e.payload={element:t},r=r===void 0?null:r,r!==null&&(e.callback=r),t=cr(i,e,o),t!==null&&(Yt(t,i,o,s),Xa(t,i,o)),o}function Ml(t){if(t=t.current,!t.child)return null;switch(t.child.tag){case 5:return t.child.stateNode;default:return t.child.stateNode}}function Zm(t,e){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var n=t.retryLane;t.retryLane=n!==0&&n<e?n:e}}function Jd(t,e){Zm(t,e),(t=t.alternate)&&Zm(t,e)}function mS(){return null}var B_=typeof reportError=="function"?reportError:function(t){console.error(t)};function Zd(t){this._internalRoot=t}yu.prototype.render=Zd.prototype.render=function(t){var e=this._internalRoot;if(e===null)throw Error(B(409));gu(t,e,null,null)};yu.prototype.unmount=Zd.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var e=t.containerInfo;ei(function(){gu(null,t,null,null)}),e[Nn]=null}};function yu(t){this._internalRoot=t}yu.prototype.unstable_scheduleHydration=function(t){if(t){var e=vv();t={blockedOn:null,target:t,priority:e};for(var n=0;n<Xn.length&&e!==0&&e<Xn[n].priority;n++);Xn.splice(n,0,t),n===0&&Ev(t)}};function ef(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function vu(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11&&(t.nodeType!==8||t.nodeValue!==" react-mount-point-unstable "))}function eg(){}function gS(t,e,n,r,i){if(i){if(typeof r=="function"){var s=r;r=function(){var h=Ml(o);s.call(h)}}var o=z_(e,r,t,0,null,!1,!1,"",eg);return t._reactRootContainer=o,t[Nn]=o.current,Ao(t.nodeType===8?t.parentNode:t),ei(),o}for(;i=t.lastChild;)t.removeChild(i);if(typeof r=="function"){var l=r;r=function(){var h=Ml(u);l.call(h)}}var u=Xd(t,0,!1,null,null,!1,!1,"",eg);return t._reactRootContainer=u,t[Nn]=u.current,Ao(t.nodeType===8?t.parentNode:t),ei(function(){gu(e,u,n,r)}),u}function _u(t,e,n,r,i){var s=n._reactRootContainer;if(s){var o=s;if(typeof i=="function"){var l=i;i=function(){var u=Ml(o);l.call(u)}}gu(e,o,t,i)}else o=gS(n,e,t,i,r);return Ml(o)}gv=function(t){switch(t.tag){case 3:var e=t.stateNode;if(e.current.memoizedState.isDehydrated){var n=Ks(e.pendingLanes);n!==0&&(_d(e,n|1),At(e,De()),!(de&6)&&(Zi=De()+500,xr()))}break;case 13:ei(function(){var r=xn(t,1);if(r!==null){var i=mt();Yt(r,t,1,i)}}),Jd(t,1)}};Ed=function(t){if(t.tag===13){var e=xn(t,134217728);if(e!==null){var n=mt();Yt(e,t,134217728,n)}Jd(t,134217728)}};yv=function(t){if(t.tag===13){var e=dr(t),n=xn(t,e);if(n!==null){var r=mt();Yt(n,t,e,r)}Jd(t,e)}};vv=function(){return pe};_v=function(t,e){var n=pe;try{return pe=t,e()}finally{pe=n}};ih=function(t,e,n){switch(e){case"input":if(Xc(t,n),e=n.name,n.type==="radio"&&e!=null){for(n=t;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+e)+'][type="radio"]'),e=0;e<n.length;e++){var r=n[e];if(r!==t&&r.form===t.form){var i=uu(r);if(!i)throw Error(B(90));Yy(r),Xc(r,i)}}}break;case"textarea":Jy(t,n);break;case"select":e=n.value,e!=null&&Oi(t,!!n.multiple,e,!1)}};sv=Gd;ov=ei;var yS={usingClientEntryPoint:!1,Events:[Go,Ci,uu,rv,iv,Gd]},$s={findFiberByHostInstance:$r,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},vS={bundleType:$s.bundleType,version:$s.version,rendererPackageName:$s.rendererPackageName,rendererConfig:$s.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Mn.ReactCurrentDispatcher,findHostInstanceByFiber:function(t){return t=uv(t),t===null?null:t.stateNode},findFiberByHostInstance:$s.findFiberByHostInstance||mS,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Ma=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Ma.isDisabled&&Ma.supportsFiber)try{su=Ma.inject(vS),ln=Ma}catch{}}bt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=yS;bt.createPortal=function(t,e){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!ef(e))throw Error(B(200));return pS(t,e,null,n)};bt.createRoot=function(t,e){if(!ef(t))throw Error(B(299));var n=!1,r="",i=B_;return e!=null&&(e.unstable_strictMode===!0&&(n=!0),e.identifierPrefix!==void 0&&(r=e.identifierPrefix),e.onRecoverableError!==void 0&&(i=e.onRecoverableError)),e=Xd(t,1,!1,null,null,n,!1,r,i),t[Nn]=e.current,Ao(t.nodeType===8?t.parentNode:t),new Zd(e)};bt.findDOMNode=function(t){if(t==null)return null;if(t.nodeType===1)return t;var e=t._reactInternals;if(e===void 0)throw typeof t.render=="function"?Error(B(188)):(t=Object.keys(t).join(","),Error(B(268,t)));return t=uv(e),t=t===null?null:t.stateNode,t};bt.flushSync=function(t){return ei(t)};bt.hydrate=function(t,e,n){if(!vu(e))throw Error(B(200));return _u(null,t,e,!0,n)};bt.hydrateRoot=function(t,e,n){if(!ef(t))throw Error(B(405));var r=n!=null&&n.hydratedSources||null,i=!1,s="",o=B_;if(n!=null&&(n.unstable_strictMode===!0&&(i=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onRecoverableError!==void 0&&(o=n.onRecoverableError)),e=z_(e,null,t,1,n??null,i,!1,s,o),t[Nn]=e.current,Ao(t),r)for(t=0;t<r.length;t++)n=r[t],i=n._getVersion,i=i(n._source),e.mutableSourceEagerHydrationData==null?e.mutableSourceEagerHydrationData=[n,i]:e.mutableSourceEagerHydrationData.push(n,i);return new yu(e)};bt.render=function(t,e,n){if(!vu(e))throw Error(B(200));return _u(null,t,e,!1,n)};bt.unmountComponentAtNode=function(t){if(!vu(t))throw Error(B(40));return t._reactRootContainer?(ei(function(){_u(null,null,t,!1,function(){t._reactRootContainer=null,t[Nn]=null})}),!0):!1};bt.unstable_batchedUpdates=Gd;bt.unstable_renderSubtreeIntoContainer=function(t,e,n,r){if(!vu(n))throw Error(B(200));if(t==null||t._reactInternals===void 0)throw Error(B(38));return _u(t,e,n,!1,r)};bt.version="18.3.1-next-f1338f8080-20240426";function j_(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(j_)}catch(t){console.error(t)}}j_(),jy.exports=bt;var _S=jy.exports,$_,tg=_S;$_=tg.createRoot,tg.hydrateRoot;const tf="ledgerApp_v1",ng=t=>{localStorage.setItem(`${tf}_currentUser`,t)},ES=()=>{localStorage.removeItem(`${tf}_currentUser`)},W_=(t,e)=>`${tf}_user_${t}_${e}`,rg=(t,e)=>{const n=localStorage.getItem(W_(t,e));return n?JSON.parse(n):null},wS=(t,e,n)=>{localStorage.setItem(W_(t,e),JSON.stringify(n))},TS=()=>{};var ig={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const H_=function(t){const e=[];let n=0;for(let r=0;r<t.length;r++){let i=t.charCodeAt(r);i<128?e[n++]=i:i<2048?(e[n++]=i>>6|192,e[n++]=i&63|128):(i&64512)===55296&&r+1<t.length&&(t.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(t.charCodeAt(++r)&1023),e[n++]=i>>18|240,e[n++]=i>>12&63|128,e[n++]=i>>6&63|128,e[n++]=i&63|128):(e[n++]=i>>12|224,e[n++]=i>>6&63|128,e[n++]=i&63|128)}return e},IS=function(t){const e=[];let n=0,r=0;for(;n<t.length;){const i=t[n++];if(i<128)e[r++]=String.fromCharCode(i);else if(i>191&&i<224){const s=t[n++];e[r++]=String.fromCharCode((i&31)<<6|s&63)}else if(i>239&&i<365){const s=t[n++],o=t[n++],l=t[n++],u=((i&7)<<18|(s&63)<<12|(o&63)<<6|l&63)-65536;e[r++]=String.fromCharCode(55296+(u>>10)),e[r++]=String.fromCharCode(56320+(u&1023))}else{const s=t[n++],o=t[n++];e[r++]=String.fromCharCode((i&15)<<12|(s&63)<<6|o&63)}}return e.join("")},q_={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<t.length;i+=3){const s=t[i],o=i+1<t.length,l=o?t[i+1]:0,u=i+2<t.length,h=u?t[i+2]:0,p=s>>2,m=(s&3)<<4|l>>4;let g=(l&15)<<2|h>>6,_=h&63;u||(_=64,o||(g=64)),r.push(n[p],n[m],n[g],n[_])}return r.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(H_(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):IS(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<t.length;){const s=n[t.charAt(i++)],l=i<t.length?n[t.charAt(i)]:0;++i;const h=i<t.length?n[t.charAt(i)]:64;++i;const m=i<t.length?n[t.charAt(i)]:64;if(++i,s==null||l==null||h==null||m==null)throw new SS;const g=s<<2|l>>4;if(r.push(g),h!==64){const _=l<<4&240|h>>2;if(r.push(_),m!==64){const N=h<<6&192|m;r.push(N)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class SS extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const AS=function(t){const e=H_(t);return q_.encodeByteArray(e,!0)},Fl=function(t){return AS(t).replace(/\./g,"")},G_=function(t){try{return q_.decodeString(t,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function CS(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const RS=()=>CS().__FIREBASE_DEFAULTS__,kS=()=>{if(typeof process>"u"||typeof ig>"u")return;const t=ig.__FIREBASE_DEFAULTS__;if(t)return JSON.parse(t)},PS=()=>{if(typeof document>"u")return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=t&&G_(t[1]);return e&&JSON.parse(e)},Eu=()=>{try{return TS()||RS()||kS()||PS()}catch(t){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${t}`);return}},K_=t=>{var e,n;return(n=(e=Eu())==null?void 0:e.emulatorHosts)==null?void 0:n[t]},NS=t=>{const e=K_(t);if(!e)return;const n=e.lastIndexOf(":");if(n<=0||n+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(n+1),10);return e[0]==="["?[e.substring(1,n-1),r]:[e.substring(0,n),r]},Q_=()=>{var t;return(t=Eu())==null?void 0:t.config},Y_=t=>{var e;return(e=Eu())==null?void 0:e[`_${t}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xS{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}wrapCallback(e){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(n):e(n,r))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bS(t,e){if(t.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n={alg:"none",type:"JWT"},r=e||"demo-project",i=t.iat||0,s=t.sub||t.user_id;if(!s)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${r}`,aud:r,iat:i,exp:i+3600,auth_time:i,sub:s,user_id:s,firebase:{sign_in_provider:"custom",identities:{}},...t};return[Fl(JSON.stringify(n)),Fl(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ct(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function DS(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(ct())}function VS(){var e;const t=(e=Eu())==null?void 0:e.forceEnvironment;if(t==="node")return!0;if(t==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function OS(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function LS(){const t=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof t=="object"&&t.id!==void 0}function MS(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function FS(){const t=ct();return t.indexOf("MSIE ")>=0||t.indexOf("Trident/")>=0}function US(){return!VS()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function zS(){try{return typeof indexedDB=="object"}catch{return!1}}function BS(){return new Promise((t,e)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),t(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{var s;e(((s=i.error)==null?void 0:s.message)||"")}}catch(n){e(n)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jS="FirebaseError";class Fn extends Error{constructor(e,n,r){super(n),this.code=e,this.customData=r,this.name=jS,Object.setPrototypeOf(this,Fn.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Qo.prototype.create)}}class Qo{constructor(e,n,r){this.service=e,this.serviceName=n,this.errors=r}create(e,...n){const r=n[0]||{},i=`${this.service}/${e}`,s=this.errors[e],o=s?$S(s,r):"Error",l=`${this.serviceName}: ${o} (${i}).`;return new Fn(i,l,r)}}function $S(t,e){return t.replace(WS,(n,r)=>{const i=e[r];return i!=null?String(i):`<${r}?>`})}const WS=/\{\$([^}]+)}/g;function HS(t){for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e))return!1;return!0}function ti(t,e){if(t===e)return!0;const n=Object.keys(t),r=Object.keys(e);for(const i of n){if(!r.includes(i))return!1;const s=t[i],o=e[i];if(sg(s)&&sg(o)){if(!ti(s,o))return!1}else if(s!==o)return!1}for(const i of r)if(!n.includes(i))return!1;return!0}function sg(t){return t!==null&&typeof t=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yo(t){const e=[];for(const[n,r]of Object.entries(t))Array.isArray(r)?r.forEach(i=>{e.push(encodeURIComponent(n)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(n)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function Ys(t){const e={};return t.replace(/^\?/,"").split("&").forEach(r=>{if(r){const[i,s]=r.split("=");e[decodeURIComponent(i)]=decodeURIComponent(s)}}),e}function Xs(t){const e=t.indexOf("?");if(!e)return"";const n=t.indexOf("#",e);return t.substring(e,n>0?n:void 0)}function qS(t,e){const n=new GS(t,e);return n.subscribe.bind(n)}class GS{constructor(e,n){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=n,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(n=>{n.next(e)})}error(e){this.forEachObserver(n=>{n.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,n,r){let i;if(e===void 0&&n===void 0&&r===void 0)throw new Error("Missing Observer.");KS(e,["next","error","complete"])?i=e:i={next:e,error:n,complete:r},i.next===void 0&&(i.next=Dc),i.error===void 0&&(i.error=Dc),i.complete===void 0&&(i.complete=Dc);const s=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?i.error(this.finalError):i.complete()}catch{}}),this.observers.push(i),s}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let n=0;n<this.observers.length;n++)this.sendOne(n,e)}sendOne(e,n){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{n(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function KS(t,e){if(typeof t!="object"||t===null)return!1;for(const n of e)if(n in t&&typeof t[n]=="function")return!0;return!1}function Dc(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ge(t){return t&&t._delegate?t._delegate:t}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xo(t){try{return(t.startsWith("http://")||t.startsWith("https://")?new URL(t).hostname:t).endsWith(".cloudworkstations.dev")}catch{return!1}}async function X_(t){return(await fetch(t,{credentials:"include"})).ok}class ni{constructor(e,n,r){this.name=e,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jr="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class QS{constructor(e,n){this.name=e,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const r=new xS;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:n});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(e){const n=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(XS(e))try{this.getOrInitializeService({instanceIdentifier:jr})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(n);try{const s=this.getOrInitializeService({instanceIdentifier:i});r.resolve(s)}catch{}}}}clearInstance(e=jr){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...e.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=jr){return this.instances.has(e)}getOptions(e=jr){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:n={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[s,o]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(s);r===l&&o.resolve(i)}return i}onInit(e,n){const r=this.normalizeInstanceIdentifier(n),i=this.onInitCallbacks.get(r)??new Set;i.add(e),this.onInitCallbacks.set(r,i);const s=this.instances.get(r);return s&&e(s,r),()=>{i.delete(e)}}invokeOnInitCallbacks(e,n){const r=this.onInitCallbacks.get(n);if(r)for(const i of r)try{i(e,n)}catch{}}getOrInitializeService({instanceIdentifier:e,options:n={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:YS(e),options:n}),this.instances.set(e,r),this.instancesOptions.set(e,n),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=jr){return this.component?this.component.multipleInstances?e:jr:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function YS(t){return t===jr?void 0:t}function XS(t){return t.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class JS{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const n=this.getProvider(e.name);if(n.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);n.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const n=new QS(e,this);return this.providers.set(e,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var le;(function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT"})(le||(le={}));const ZS={debug:le.DEBUG,verbose:le.VERBOSE,info:le.INFO,warn:le.WARN,error:le.ERROR,silent:le.SILENT},e1=le.INFO,t1={[le.DEBUG]:"log",[le.VERBOSE]:"log",[le.INFO]:"info",[le.WARN]:"warn",[le.ERROR]:"error"},n1=(t,e,...n)=>{if(e<t.logLevel)return;const r=new Date().toISOString(),i=t1[e];if(i)console[i](`[${r}]  ${t.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class nf{constructor(e){this.name=e,this._logLevel=e1,this._logHandler=n1,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in le))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?ZS[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,le.DEBUG,...e),this._logHandler(this,le.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,le.VERBOSE,...e),this._logHandler(this,le.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,le.INFO,...e),this._logHandler(this,le.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,le.WARN,...e),this._logHandler(this,le.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,le.ERROR,...e),this._logHandler(this,le.ERROR,...e)}}const r1=(t,e)=>e.some(n=>t instanceof n);let og,ag;function i1(){return og||(og=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function s1(){return ag||(ag=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const J_=new WeakMap,Mh=new WeakMap,Z_=new WeakMap,Vc=new WeakMap,rf=new WeakMap;function o1(t){const e=new Promise((n,r)=>{const i=()=>{t.removeEventListener("success",s),t.removeEventListener("error",o)},s=()=>{n(pr(t.result)),i()},o=()=>{r(t.error),i()};t.addEventListener("success",s),t.addEventListener("error",o)});return e.then(n=>{n instanceof IDBCursor&&J_.set(n,t)}).catch(()=>{}),rf.set(e,t),e}function a1(t){if(Mh.has(t))return;const e=new Promise((n,r)=>{const i=()=>{t.removeEventListener("complete",s),t.removeEventListener("error",o),t.removeEventListener("abort",o)},s=()=>{n(),i()},o=()=>{r(t.error||new DOMException("AbortError","AbortError")),i()};t.addEventListener("complete",s),t.addEventListener("error",o),t.addEventListener("abort",o)});Mh.set(t,e)}let Fh={get(t,e,n){if(t instanceof IDBTransaction){if(e==="done")return Mh.get(t);if(e==="objectStoreNames")return t.objectStoreNames||Z_.get(t);if(e==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return pr(t[e])},set(t,e,n){return t[e]=n,!0},has(t,e){return t instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in t}};function l1(t){Fh=t(Fh)}function u1(t){return t===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...n){const r=t.call(Oc(this),e,...n);return Z_.set(r,e.sort?e.sort():[e]),pr(r)}:s1().includes(t)?function(...e){return t.apply(Oc(this),e),pr(J_.get(this))}:function(...e){return pr(t.apply(Oc(this),e))}}function c1(t){return typeof t=="function"?u1(t):(t instanceof IDBTransaction&&a1(t),r1(t,i1())?new Proxy(t,Fh):t)}function pr(t){if(t instanceof IDBRequest)return o1(t);if(Vc.has(t))return Vc.get(t);const e=c1(t);return e!==t&&(Vc.set(t,e),rf.set(e,t)),e}const Oc=t=>rf.get(t);function h1(t,e,{blocked:n,upgrade:r,blocking:i,terminated:s}={}){const o=indexedDB.open(t,e),l=pr(o);return r&&o.addEventListener("upgradeneeded",u=>{r(pr(o.result),u.oldVersion,u.newVersion,pr(o.transaction),u)}),n&&o.addEventListener("blocked",u=>n(u.oldVersion,u.newVersion,u)),l.then(u=>{s&&u.addEventListener("close",()=>s()),i&&u.addEventListener("versionchange",h=>i(h.oldVersion,h.newVersion,h))}).catch(()=>{}),l}const d1=["get","getKey","getAll","getAllKeys","count"],f1=["put","add","delete","clear"],Lc=new Map;function lg(t,e){if(!(t instanceof IDBDatabase&&!(e in t)&&typeof e=="string"))return;if(Lc.get(e))return Lc.get(e);const n=e.replace(/FromIndex$/,""),r=e!==n,i=f1.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(i||d1.includes(n)))return;const s=async function(o,...l){const u=this.transaction(o,i?"readwrite":"readonly");let h=u.store;return r&&(h=h.index(l.shift())),(await Promise.all([h[n](...l),i&&u.done]))[0]};return Lc.set(e,s),s}l1(t=>({...t,get:(e,n,r)=>lg(e,n)||t.get(e,n,r),has:(e,n)=>!!lg(e,n)||t.has(e,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class p1{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(m1(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function m1(t){const e=t.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Uh="@firebase/app",ug="0.14.10";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dn=new nf("@firebase/app"),g1="@firebase/app-compat",y1="@firebase/analytics-compat",v1="@firebase/analytics",_1="@firebase/app-check-compat",E1="@firebase/app-check",w1="@firebase/auth",T1="@firebase/auth-compat",I1="@firebase/database",S1="@firebase/data-connect",A1="@firebase/database-compat",C1="@firebase/functions",R1="@firebase/functions-compat",k1="@firebase/installations",P1="@firebase/installations-compat",N1="@firebase/messaging",x1="@firebase/messaging-compat",b1="@firebase/performance",D1="@firebase/performance-compat",V1="@firebase/remote-config",O1="@firebase/remote-config-compat",L1="@firebase/storage",M1="@firebase/storage-compat",F1="@firebase/firestore",U1="@firebase/ai",z1="@firebase/firestore-compat",B1="firebase",j1="12.11.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zh="[DEFAULT]",$1={[Uh]:"fire-core",[g1]:"fire-core-compat",[v1]:"fire-analytics",[y1]:"fire-analytics-compat",[E1]:"fire-app-check",[_1]:"fire-app-check-compat",[w1]:"fire-auth",[T1]:"fire-auth-compat",[I1]:"fire-rtdb",[S1]:"fire-data-connect",[A1]:"fire-rtdb-compat",[C1]:"fire-fn",[R1]:"fire-fn-compat",[k1]:"fire-iid",[P1]:"fire-iid-compat",[N1]:"fire-fcm",[x1]:"fire-fcm-compat",[b1]:"fire-perf",[D1]:"fire-perf-compat",[V1]:"fire-rc",[O1]:"fire-rc-compat",[L1]:"fire-gcs",[M1]:"fire-gcs-compat",[F1]:"fire-fst",[z1]:"fire-fst-compat",[U1]:"fire-vertex","fire-js":"fire-js",[B1]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ul=new Map,W1=new Map,Bh=new Map;function cg(t,e){try{t.container.addComponent(e)}catch(n){Dn.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`,n)}}function es(t){const e=t.name;if(Bh.has(e))return Dn.debug(`There were multiple attempts to register component ${e}.`),!1;Bh.set(e,t);for(const n of Ul.values())cg(n,t);for(const n of W1.values())cg(n,t);return!0}function sf(t,e){const n=t.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),t.container.getProvider(e)}function Mt(t){return t==null?!1:t.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const H1={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},mr=new Qo("app","Firebase",H1);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q1{constructor(e,n,r){this._isDeleted=!1,this._options={...e},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new ni("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw mr.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hs=j1;function eE(t,e={}){let n=t;typeof e!="object"&&(e={name:e});const r={name:zh,automaticDataCollectionEnabled:!0,...e},i=r.name;if(typeof i!="string"||!i)throw mr.create("bad-app-name",{appName:String(i)});if(n||(n=Q_()),!n)throw mr.create("no-options");const s=Ul.get(i);if(s){if(ti(n,s.options)&&ti(r,s.config))return s;throw mr.create("duplicate-app",{appName:i})}const o=new JS(i);for(const u of Bh.values())o.addComponent(u);const l=new q1(n,r,o);return Ul.set(i,l),l}function tE(t=zh){const e=Ul.get(t);if(!e&&t===zh&&Q_())return eE();if(!e)throw mr.create("no-app",{appName:t});return e}function gr(t,e,n){let r=$1[t]??t;n&&(r+=`-${n}`);const i=r.match(/\s|\//),s=e.match(/\s|\//);if(i||s){const o=[`Unable to register library "${r}" with version "${e}":`];i&&o.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&s&&o.push("and"),s&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Dn.warn(o.join(" "));return}es(new ni(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const G1="firebase-heartbeat-database",K1=1,Vo="firebase-heartbeat-store";let Mc=null;function nE(){return Mc||(Mc=h1(G1,K1,{upgrade:(t,e)=>{switch(e){case 0:try{t.createObjectStore(Vo)}catch(n){console.warn(n)}}}}).catch(t=>{throw mr.create("idb-open",{originalErrorMessage:t.message})})),Mc}async function Q1(t){try{const n=(await nE()).transaction(Vo),r=await n.objectStore(Vo).get(rE(t));return await n.done,r}catch(e){if(e instanceof Fn)Dn.warn(e.message);else{const n=mr.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Dn.warn(n.message)}}}async function hg(t,e){try{const r=(await nE()).transaction(Vo,"readwrite");await r.objectStore(Vo).put(e,rE(t)),await r.done}catch(n){if(n instanceof Fn)Dn.warn(n.message);else{const r=mr.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});Dn.warn(r.message)}}}function rE(t){return`${t.name}!${t.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Y1=1024,X1=30;class J1{constructor(e){this.container=e,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new eA(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,n;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=dg();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(o=>o.date===s))return;if(this._heartbeatsCache.heartbeats.push({date:s,agent:i}),this._heartbeatsCache.heartbeats.length>X1){const o=tA(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){Dn.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=dg(),{heartbeatsToSend:r,unsentEntries:i}=Z1(this._heartbeatsCache.heartbeats),s=Fl(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(n){return Dn.warn(n),""}}}function dg(){return new Date().toISOString().substring(0,10)}function Z1(t,e=Y1){const n=[];let r=t.slice();for(const i of t){const s=n.find(o=>o.agent===i.agent);if(s){if(s.dates.push(i.date),fg(n)>e){s.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),fg(n)>e){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class eA{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return zS()?BS().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await Q1(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return hg(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return hg(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function fg(t){return Fl(JSON.stringify({version:2,heartbeats:t})).length}function tA(t){if(t.length===0)return-1;let e=0,n=t[0].date;for(let r=1;r<t.length;r++)t[r].date<n&&(n=t[r].date,e=r);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nA(t){es(new ni("platform-logger",e=>new p1(e),"PRIVATE")),es(new ni("heartbeat",e=>new J1(e),"PRIVATE")),gr(Uh,ug,t),gr(Uh,ug,"esm2020"),gr("fire-js","")}nA("");var rA="firebase",iA="12.11.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */gr(rA,iA,"app");var pg=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var yr,iE;(function(){var t;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(w,v){function E(){}E.prototype=v.prototype,w.F=v.prototype,w.prototype=new E,w.prototype.constructor=w,w.D=function(A,C,x){for(var S=Array(arguments.length-2),L=2;L<arguments.length;L++)S[L-2]=arguments[L];return v.prototype[C].apply(A,S)}}function n(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,n),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(w,v,E){E||(E=0);const A=Array(16);if(typeof v=="string")for(var C=0;C<16;++C)A[C]=v.charCodeAt(E++)|v.charCodeAt(E++)<<8|v.charCodeAt(E++)<<16|v.charCodeAt(E++)<<24;else for(C=0;C<16;++C)A[C]=v[E++]|v[E++]<<8|v[E++]<<16|v[E++]<<24;v=w.g[0],E=w.g[1],C=w.g[2];let x=w.g[3],S;S=v+(x^E&(C^x))+A[0]+3614090360&4294967295,v=E+(S<<7&4294967295|S>>>25),S=x+(C^v&(E^C))+A[1]+3905402710&4294967295,x=v+(S<<12&4294967295|S>>>20),S=C+(E^x&(v^E))+A[2]+606105819&4294967295,C=x+(S<<17&4294967295|S>>>15),S=E+(v^C&(x^v))+A[3]+3250441966&4294967295,E=C+(S<<22&4294967295|S>>>10),S=v+(x^E&(C^x))+A[4]+4118548399&4294967295,v=E+(S<<7&4294967295|S>>>25),S=x+(C^v&(E^C))+A[5]+1200080426&4294967295,x=v+(S<<12&4294967295|S>>>20),S=C+(E^x&(v^E))+A[6]+2821735955&4294967295,C=x+(S<<17&4294967295|S>>>15),S=E+(v^C&(x^v))+A[7]+4249261313&4294967295,E=C+(S<<22&4294967295|S>>>10),S=v+(x^E&(C^x))+A[8]+1770035416&4294967295,v=E+(S<<7&4294967295|S>>>25),S=x+(C^v&(E^C))+A[9]+2336552879&4294967295,x=v+(S<<12&4294967295|S>>>20),S=C+(E^x&(v^E))+A[10]+4294925233&4294967295,C=x+(S<<17&4294967295|S>>>15),S=E+(v^C&(x^v))+A[11]+2304563134&4294967295,E=C+(S<<22&4294967295|S>>>10),S=v+(x^E&(C^x))+A[12]+1804603682&4294967295,v=E+(S<<7&4294967295|S>>>25),S=x+(C^v&(E^C))+A[13]+4254626195&4294967295,x=v+(S<<12&4294967295|S>>>20),S=C+(E^x&(v^E))+A[14]+2792965006&4294967295,C=x+(S<<17&4294967295|S>>>15),S=E+(v^C&(x^v))+A[15]+1236535329&4294967295,E=C+(S<<22&4294967295|S>>>10),S=v+(C^x&(E^C))+A[1]+4129170786&4294967295,v=E+(S<<5&4294967295|S>>>27),S=x+(E^C&(v^E))+A[6]+3225465664&4294967295,x=v+(S<<9&4294967295|S>>>23),S=C+(v^E&(x^v))+A[11]+643717713&4294967295,C=x+(S<<14&4294967295|S>>>18),S=E+(x^v&(C^x))+A[0]+3921069994&4294967295,E=C+(S<<20&4294967295|S>>>12),S=v+(C^x&(E^C))+A[5]+3593408605&4294967295,v=E+(S<<5&4294967295|S>>>27),S=x+(E^C&(v^E))+A[10]+38016083&4294967295,x=v+(S<<9&4294967295|S>>>23),S=C+(v^E&(x^v))+A[15]+3634488961&4294967295,C=x+(S<<14&4294967295|S>>>18),S=E+(x^v&(C^x))+A[4]+3889429448&4294967295,E=C+(S<<20&4294967295|S>>>12),S=v+(C^x&(E^C))+A[9]+568446438&4294967295,v=E+(S<<5&4294967295|S>>>27),S=x+(E^C&(v^E))+A[14]+3275163606&4294967295,x=v+(S<<9&4294967295|S>>>23),S=C+(v^E&(x^v))+A[3]+4107603335&4294967295,C=x+(S<<14&4294967295|S>>>18),S=E+(x^v&(C^x))+A[8]+1163531501&4294967295,E=C+(S<<20&4294967295|S>>>12),S=v+(C^x&(E^C))+A[13]+2850285829&4294967295,v=E+(S<<5&4294967295|S>>>27),S=x+(E^C&(v^E))+A[2]+4243563512&4294967295,x=v+(S<<9&4294967295|S>>>23),S=C+(v^E&(x^v))+A[7]+1735328473&4294967295,C=x+(S<<14&4294967295|S>>>18),S=E+(x^v&(C^x))+A[12]+2368359562&4294967295,E=C+(S<<20&4294967295|S>>>12),S=v+(E^C^x)+A[5]+4294588738&4294967295,v=E+(S<<4&4294967295|S>>>28),S=x+(v^E^C)+A[8]+2272392833&4294967295,x=v+(S<<11&4294967295|S>>>21),S=C+(x^v^E)+A[11]+1839030562&4294967295,C=x+(S<<16&4294967295|S>>>16),S=E+(C^x^v)+A[14]+4259657740&4294967295,E=C+(S<<23&4294967295|S>>>9),S=v+(E^C^x)+A[1]+2763975236&4294967295,v=E+(S<<4&4294967295|S>>>28),S=x+(v^E^C)+A[4]+1272893353&4294967295,x=v+(S<<11&4294967295|S>>>21),S=C+(x^v^E)+A[7]+4139469664&4294967295,C=x+(S<<16&4294967295|S>>>16),S=E+(C^x^v)+A[10]+3200236656&4294967295,E=C+(S<<23&4294967295|S>>>9),S=v+(E^C^x)+A[13]+681279174&4294967295,v=E+(S<<4&4294967295|S>>>28),S=x+(v^E^C)+A[0]+3936430074&4294967295,x=v+(S<<11&4294967295|S>>>21),S=C+(x^v^E)+A[3]+3572445317&4294967295,C=x+(S<<16&4294967295|S>>>16),S=E+(C^x^v)+A[6]+76029189&4294967295,E=C+(S<<23&4294967295|S>>>9),S=v+(E^C^x)+A[9]+3654602809&4294967295,v=E+(S<<4&4294967295|S>>>28),S=x+(v^E^C)+A[12]+3873151461&4294967295,x=v+(S<<11&4294967295|S>>>21),S=C+(x^v^E)+A[15]+530742520&4294967295,C=x+(S<<16&4294967295|S>>>16),S=E+(C^x^v)+A[2]+3299628645&4294967295,E=C+(S<<23&4294967295|S>>>9),S=v+(C^(E|~x))+A[0]+4096336452&4294967295,v=E+(S<<6&4294967295|S>>>26),S=x+(E^(v|~C))+A[7]+1126891415&4294967295,x=v+(S<<10&4294967295|S>>>22),S=C+(v^(x|~E))+A[14]+2878612391&4294967295,C=x+(S<<15&4294967295|S>>>17),S=E+(x^(C|~v))+A[5]+4237533241&4294967295,E=C+(S<<21&4294967295|S>>>11),S=v+(C^(E|~x))+A[12]+1700485571&4294967295,v=E+(S<<6&4294967295|S>>>26),S=x+(E^(v|~C))+A[3]+2399980690&4294967295,x=v+(S<<10&4294967295|S>>>22),S=C+(v^(x|~E))+A[10]+4293915773&4294967295,C=x+(S<<15&4294967295|S>>>17),S=E+(x^(C|~v))+A[1]+2240044497&4294967295,E=C+(S<<21&4294967295|S>>>11),S=v+(C^(E|~x))+A[8]+1873313359&4294967295,v=E+(S<<6&4294967295|S>>>26),S=x+(E^(v|~C))+A[15]+4264355552&4294967295,x=v+(S<<10&4294967295|S>>>22),S=C+(v^(x|~E))+A[6]+2734768916&4294967295,C=x+(S<<15&4294967295|S>>>17),S=E+(x^(C|~v))+A[13]+1309151649&4294967295,E=C+(S<<21&4294967295|S>>>11),S=v+(C^(E|~x))+A[4]+4149444226&4294967295,v=E+(S<<6&4294967295|S>>>26),S=x+(E^(v|~C))+A[11]+3174756917&4294967295,x=v+(S<<10&4294967295|S>>>22),S=C+(v^(x|~E))+A[2]+718787259&4294967295,C=x+(S<<15&4294967295|S>>>17),S=E+(x^(C|~v))+A[9]+3951481745&4294967295,w.g[0]=w.g[0]+v&4294967295,w.g[1]=w.g[1]+(C+(S<<21&4294967295|S>>>11))&4294967295,w.g[2]=w.g[2]+C&4294967295,w.g[3]=w.g[3]+x&4294967295}r.prototype.v=function(w,v){v===void 0&&(v=w.length);const E=v-this.blockSize,A=this.C;let C=this.h,x=0;for(;x<v;){if(C==0)for(;x<=E;)i(this,w,x),x+=this.blockSize;if(typeof w=="string"){for(;x<v;)if(A[C++]=w.charCodeAt(x++),C==this.blockSize){i(this,A),C=0;break}}else for(;x<v;)if(A[C++]=w[x++],C==this.blockSize){i(this,A),C=0;break}}this.h=C,this.o+=v},r.prototype.A=function(){var w=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);w[0]=128;for(var v=1;v<w.length-8;++v)w[v]=0;v=this.o*8;for(var E=w.length-8;E<w.length;++E)w[E]=v&255,v/=256;for(this.v(w),w=Array(16),v=0,E=0;E<4;++E)for(let A=0;A<32;A+=8)w[v++]=this.g[E]>>>A&255;return w};function s(w,v){var E=l;return Object.prototype.hasOwnProperty.call(E,w)?E[w]:E[w]=v(w)}function o(w,v){this.h=v;const E=[];let A=!0;for(let C=w.length-1;C>=0;C--){const x=w[C]|0;A&&x==v||(E[C]=x,A=!1)}this.g=E}var l={};function u(w){return-128<=w&&w<128?s(w,function(v){return new o([v|0],v<0?-1:0)}):new o([w|0],w<0?-1:0)}function h(w){if(isNaN(w)||!isFinite(w))return m;if(w<0)return k(h(-w));const v=[];let E=1;for(let A=0;w>=E;A++)v[A]=w/E|0,E*=4294967296;return new o(v,0)}function p(w,v){if(w.length==0)throw Error("number format error: empty string");if(v=v||10,v<2||36<v)throw Error("radix out of range: "+v);if(w.charAt(0)=="-")return k(p(w.substring(1),v));if(w.indexOf("-")>=0)throw Error('number format error: interior "-" character');const E=h(Math.pow(v,8));let A=m;for(let x=0;x<w.length;x+=8){var C=Math.min(8,w.length-x);const S=parseInt(w.substring(x,x+C),v);C<8?(C=h(Math.pow(v,C)),A=A.j(C).add(h(S))):(A=A.j(E),A=A.add(h(S)))}return A}var m=u(0),g=u(1),_=u(16777216);t=o.prototype,t.m=function(){if(R(this))return-k(this).m();let w=0,v=1;for(let E=0;E<this.g.length;E++){const A=this.i(E);w+=(A>=0?A:4294967296+A)*v,v*=4294967296}return w},t.toString=function(w){if(w=w||10,w<2||36<w)throw Error("radix out of range: "+w);if(N(this))return"0";if(R(this))return"-"+k(this).toString(w);const v=h(Math.pow(w,6));var E=this;let A="";for(;;){const C=b(E,v).g;E=I(E,C.j(v));let x=((E.g.length>0?E.g[0]:E.h)>>>0).toString(w);if(E=C,N(E))return x+A;for(;x.length<6;)x="0"+x;A=x+A}},t.i=function(w){return w<0?0:w<this.g.length?this.g[w]:this.h};function N(w){if(w.h!=0)return!1;for(let v=0;v<w.g.length;v++)if(w.g[v]!=0)return!1;return!0}function R(w){return w.h==-1}t.l=function(w){return w=I(this,w),R(w)?-1:N(w)?0:1};function k(w){const v=w.g.length,E=[];for(let A=0;A<v;A++)E[A]=~w.g[A];return new o(E,~w.h).add(g)}t.abs=function(){return R(this)?k(this):this},t.add=function(w){const v=Math.max(this.g.length,w.g.length),E=[];let A=0;for(let C=0;C<=v;C++){let x=A+(this.i(C)&65535)+(w.i(C)&65535),S=(x>>>16)+(this.i(C)>>>16)+(w.i(C)>>>16);A=S>>>16,x&=65535,S&=65535,E[C]=S<<16|x}return new o(E,E[E.length-1]&-2147483648?-1:0)};function I(w,v){return w.add(k(v))}t.j=function(w){if(N(this)||N(w))return m;if(R(this))return R(w)?k(this).j(k(w)):k(k(this).j(w));if(R(w))return k(this.j(k(w)));if(this.l(_)<0&&w.l(_)<0)return h(this.m()*w.m());const v=this.g.length+w.g.length,E=[];for(var A=0;A<2*v;A++)E[A]=0;for(A=0;A<this.g.length;A++)for(let C=0;C<w.g.length;C++){const x=this.i(A)>>>16,S=this.i(A)&65535,L=w.i(C)>>>16,q=w.i(C)&65535;E[2*A+2*C]+=S*q,T(E,2*A+2*C),E[2*A+2*C+1]+=x*q,T(E,2*A+2*C+1),E[2*A+2*C+1]+=S*L,T(E,2*A+2*C+1),E[2*A+2*C+2]+=x*L,T(E,2*A+2*C+2)}for(w=0;w<v;w++)E[w]=E[2*w+1]<<16|E[2*w];for(w=v;w<2*v;w++)E[w]=0;return new o(E,0)};function T(w,v){for(;(w[v]&65535)!=w[v];)w[v+1]+=w[v]>>>16,w[v]&=65535,v++}function P(w,v){this.g=w,this.h=v}function b(w,v){if(N(v))throw Error("division by zero");if(N(w))return new P(m,m);if(R(w))return v=b(k(w),v),new P(k(v.g),k(v.h));if(R(v))return v=b(w,k(v)),new P(k(v.g),v.h);if(w.g.length>30){if(R(w)||R(v))throw Error("slowDivide_ only works with positive integers.");for(var E=g,A=v;A.l(w)<=0;)E=V(E),A=V(A);var C=M(E,1),x=M(A,1);for(A=M(A,2),E=M(E,2);!N(A);){var S=x.add(A);S.l(w)<=0&&(C=C.add(E),x=S),A=M(A,1),E=M(E,1)}return v=I(w,C.j(v)),new P(C,v)}for(C=m;w.l(v)>=0;){for(E=Math.max(1,Math.floor(w.m()/v.m())),A=Math.ceil(Math.log(E)/Math.LN2),A=A<=48?1:Math.pow(2,A-48),x=h(E),S=x.j(v);R(S)||S.l(w)>0;)E-=A,x=h(E),S=x.j(v);N(x)&&(x=g),C=C.add(x),w=I(w,S)}return new P(C,w)}t.B=function(w){return b(this,w).h},t.and=function(w){const v=Math.max(this.g.length,w.g.length),E=[];for(let A=0;A<v;A++)E[A]=this.i(A)&w.i(A);return new o(E,this.h&w.h)},t.or=function(w){const v=Math.max(this.g.length,w.g.length),E=[];for(let A=0;A<v;A++)E[A]=this.i(A)|w.i(A);return new o(E,this.h|w.h)},t.xor=function(w){const v=Math.max(this.g.length,w.g.length),E=[];for(let A=0;A<v;A++)E[A]=this.i(A)^w.i(A);return new o(E,this.h^w.h)};function V(w){const v=w.g.length+1,E=[];for(let A=0;A<v;A++)E[A]=w.i(A)<<1|w.i(A-1)>>>31;return new o(E,w.h)}function M(w,v){const E=v>>5;v%=32;const A=w.g.length-E,C=[];for(let x=0;x<A;x++)C[x]=v>0?w.i(x+E)>>>v|w.i(x+E+1)<<32-v:w.i(x+E);return new o(C,w.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,iE=r,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=h,o.fromString=p,yr=o}).apply(typeof pg<"u"?pg:typeof self<"u"?self:typeof window<"u"?window:{});var Fa=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var sE,Js,oE,il,jh,aE,lE,uE;(function(){var t,e=Object.defineProperty;function n(a){a=[typeof globalThis=="object"&&globalThis,a,typeof window=="object"&&window,typeof self=="object"&&self,typeof Fa=="object"&&Fa];for(var c=0;c<a.length;++c){var d=a[c];if(d&&d.Math==Math)return d}throw Error("Cannot find global object")}var r=n(this);function i(a,c){if(c)e:{var d=r;a=a.split(".");for(var y=0;y<a.length-1;y++){var D=a[y];if(!(D in d))break e;d=d[D]}a=a[a.length-1],y=d[a],c=c(y),c!=y&&c!=null&&e(d,a,{configurable:!0,writable:!0,value:c})}}i("Symbol.dispose",function(a){return a||Symbol("Symbol.dispose")}),i("Array.prototype.values",function(a){return a||function(){return this[Symbol.iterator]()}}),i("Object.entries",function(a){return a||function(c){var d=[],y;for(y in c)Object.prototype.hasOwnProperty.call(c,y)&&d.push([y,c[y]]);return d}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var s=s||{},o=this||self;function l(a){var c=typeof a;return c=="object"&&a!=null||c=="function"}function u(a,c,d){return a.call.apply(a.bind,arguments)}function h(a,c,d){return h=u,h.apply(null,arguments)}function p(a,c){var d=Array.prototype.slice.call(arguments,1);return function(){var y=d.slice();return y.push.apply(y,arguments),a.apply(this,y)}}function m(a,c){function d(){}d.prototype=c.prototype,a.Z=c.prototype,a.prototype=new d,a.prototype.constructor=a,a.Ob=function(y,D,O){for(var $=Array(arguments.length-2),ie=2;ie<arguments.length;ie++)$[ie-2]=arguments[ie];return c.prototype[D].apply(y,$)}}var g=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?a=>a&&AsyncContext.Snapshot.wrap(a):a=>a;function _(a){const c=a.length;if(c>0){const d=Array(c);for(let y=0;y<c;y++)d[y]=a[y];return d}return[]}function N(a,c){for(let y=1;y<arguments.length;y++){const D=arguments[y];var d=typeof D;if(d=d!="object"?d:D?Array.isArray(D)?"array":d:"null",d=="array"||d=="object"&&typeof D.length=="number"){d=a.length||0;const O=D.length||0;a.length=d+O;for(let $=0;$<O;$++)a[d+$]=D[$]}else a.push(D)}}class R{constructor(c,d){this.i=c,this.j=d,this.h=0,this.g=null}get(){let c;return this.h>0?(this.h--,c=this.g,this.g=c.next,c.next=null):c=this.i(),c}}function k(a){o.setTimeout(()=>{throw a},0)}function I(){var a=w;let c=null;return a.g&&(c=a.g,a.g=a.g.next,a.g||(a.h=null),c.next=null),c}class T{constructor(){this.h=this.g=null}add(c,d){const y=P.get();y.set(c,d),this.h?this.h.next=y:this.g=y,this.h=y}}var P=new R(()=>new b,a=>a.reset());class b{constructor(){this.next=this.g=this.h=null}set(c,d){this.h=c,this.g=d,this.next=null}reset(){this.next=this.g=this.h=null}}let V,M=!1,w=new T,v=()=>{const a=Promise.resolve(void 0);V=()=>{a.then(E)}};function E(){for(var a;a=I();){try{a.h.call(a.g)}catch(d){k(d)}var c=P;c.j(a),c.h<100&&(c.h++,a.next=c.g,c.g=a)}M=!1}function A(){this.u=this.u,this.C=this.C}A.prototype.u=!1,A.prototype.dispose=function(){this.u||(this.u=!0,this.N())},A.prototype[Symbol.dispose]=function(){this.dispose()},A.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function C(a,c){this.type=a,this.g=this.target=c,this.defaultPrevented=!1}C.prototype.h=function(){this.defaultPrevented=!0};var x=function(){if(!o.addEventListener||!Object.defineProperty)return!1;var a=!1,c=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const d=()=>{};o.addEventListener("test",d,c),o.removeEventListener("test",d,c)}catch{}return a}();function S(a){return/^[\s\xa0]*$/.test(a)}function L(a,c){C.call(this,a?a.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,a&&this.init(a,c)}m(L,C),L.prototype.init=function(a,c){const d=this.type=a.type,y=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement,this.g=c,c=a.relatedTarget,c||(d=="mouseover"?c=a.fromElement:d=="mouseout"&&(c=a.toElement)),this.relatedTarget=c,y?(this.clientX=y.clientX!==void 0?y.clientX:y.pageX,this.clientY=y.clientY!==void 0?y.clientY:y.pageY,this.screenX=y.screenX||0,this.screenY=y.screenY||0):(this.clientX=a.clientX!==void 0?a.clientX:a.pageX,this.clientY=a.clientY!==void 0?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0),this.button=a.button,this.key=a.key||"",this.ctrlKey=a.ctrlKey,this.altKey=a.altKey,this.shiftKey=a.shiftKey,this.metaKey=a.metaKey,this.pointerId=a.pointerId||0,this.pointerType=a.pointerType,this.state=a.state,this.i=a,a.defaultPrevented&&L.Z.h.call(this)},L.prototype.h=function(){L.Z.h.call(this);const a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1};var q="closure_listenable_"+(Math.random()*1e6|0),se=0;function et(a,c,d,y,D){this.listener=a,this.proxy=null,this.src=c,this.type=d,this.capture=!!y,this.ha=D,this.key=++se,this.da=this.fa=!1}function j(a){a.da=!0,a.listener=null,a.proxy=null,a.src=null,a.ha=null}function Q(a,c,d){for(const y in a)c.call(d,a[y],y,a)}function X(a,c){for(const d in a)c.call(void 0,a[d],d,a)}function z(a){const c={};for(const d in a)c[d]=a[d];return c}const W="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Se(a,c){let d,y;for(let D=1;D<arguments.length;D++){y=arguments[D];for(d in y)a[d]=y[d];for(let O=0;O<W.length;O++)d=W[O],Object.prototype.hasOwnProperty.call(y,d)&&(a[d]=y[d])}}function tt(a){this.src=a,this.g={},this.h=0}tt.prototype.add=function(a,c,d,y,D){const O=a.toString();a=this.g[O],a||(a=this.g[O]=[],this.h++);const $=ve(a,c,y,D);return $>-1?(c=a[$],d||(c.fa=!1)):(c=new et(c,this.src,O,!!y,D),c.fa=d,a.push(c)),c};function ht(a,c){const d=c.type;if(d in a.g){var y=a.g[d],D=Array.prototype.indexOf.call(y,c,void 0),O;(O=D>=0)&&Array.prototype.splice.call(y,D,1),O&&(j(c),a.g[d].length==0&&(delete a.g[d],a.h--))}}function ve(a,c,d,y){for(let D=0;D<a.length;++D){const O=a[D];if(!O.da&&O.listener==c&&O.capture==!!d&&O.ha==y)return D}return-1}var vt="closure_lm_"+(Math.random()*1e6|0),di={};function _s(a,c,d,y,D){if(Array.isArray(c)){for(let O=0;O<c.length;O++)_s(a,c[O],d,y,D);return null}return d=Jf(d),a&&a[q]?a.J(c,d,l(y)?!!y.capture:!1,D):la(a,c,d,!1,y,D)}function la(a,c,d,y,D,O){if(!c)throw Error("Invalid event type");const $=l(D)?!!D.capture:!!D;let ie=ju(a);if(ie||(a[vt]=ie=new tt(a)),d=ie.add(c,d,y,$,O),d.proxy)return d;if(y=AT(),d.proxy=y,y.src=a,y.listener=d,a.addEventListener)x||(D=$),D===void 0&&(D=!1),a.addEventListener(c.toString(),y,D);else if(a.attachEvent)a.attachEvent(Xf(c.toString()),y);else if(a.addListener&&a.removeListener)a.addListener(y);else throw Error("addEventListener and attachEvent are unavailable.");return d}function AT(){function a(d){return c.call(a.src,a.listener,d)}const c=CT;return a}function Yf(a,c,d,y,D){if(Array.isArray(c))for(var O=0;O<c.length;O++)Yf(a,c[O],d,y,D);else y=l(y)?!!y.capture:!!y,d=Jf(d),a&&a[q]?(a=a.i,O=String(c).toString(),O in a.g&&(c=a.g[O],d=ve(c,d,y,D),d>-1&&(j(c[d]),Array.prototype.splice.call(c,d,1),c.length==0&&(delete a.g[O],a.h--)))):a&&(a=ju(a))&&(c=a.g[c.toString()],a=-1,c&&(a=ve(c,d,y,D)),(d=a>-1?c[a]:null)&&Bu(d))}function Bu(a){if(typeof a!="number"&&a&&!a.da){var c=a.src;if(c&&c[q])ht(c.i,a);else{var d=a.type,y=a.proxy;c.removeEventListener?c.removeEventListener(d,y,a.capture):c.detachEvent?c.detachEvent(Xf(d),y):c.addListener&&c.removeListener&&c.removeListener(y),(d=ju(c))?(ht(d,a),d.h==0&&(d.src=null,c[vt]=null)):j(a)}}}function Xf(a){return a in di?di[a]:di[a]="on"+a}function CT(a,c){if(a.da)a=!0;else{c=new L(c,this);const d=a.listener,y=a.ha||a.src;a.fa&&Bu(a),a=d.call(y,c)}return a}function ju(a){return a=a[vt],a instanceof tt?a:null}var $u="__closure_events_fn_"+(Math.random()*1e9>>>0);function Jf(a){return typeof a=="function"?a:(a[$u]||(a[$u]=function(c){return a.handleEvent(c)}),a[$u])}function nt(){A.call(this),this.i=new tt(this),this.M=this,this.G=null}m(nt,A),nt.prototype[q]=!0,nt.prototype.removeEventListener=function(a,c,d,y){Yf(this,a,c,d,y)};function dt(a,c){var d,y=a.G;if(y)for(d=[];y;y=y.G)d.push(y);if(a=a.M,y=c.type||c,typeof c=="string")c=new C(c,a);else if(c instanceof C)c.target=c.target||a;else{var D=c;c=new C(y,a),Se(c,D)}D=!0;let O,$;if(d)for($=d.length-1;$>=0;$--)O=c.g=d[$],D=ua(O,y,!0,c)&&D;if(O=c.g=a,D=ua(O,y,!0,c)&&D,D=ua(O,y,!1,c)&&D,d)for($=0;$<d.length;$++)O=c.g=d[$],D=ua(O,y,!1,c)&&D}nt.prototype.N=function(){if(nt.Z.N.call(this),this.i){var a=this.i;for(const c in a.g){const d=a.g[c];for(let y=0;y<d.length;y++)j(d[y]);delete a.g[c],a.h--}}this.G=null},nt.prototype.J=function(a,c,d,y){return this.i.add(String(a),c,!1,d,y)},nt.prototype.K=function(a,c,d,y){return this.i.add(String(a),c,!0,d,y)};function ua(a,c,d,y){if(c=a.i.g[String(c)],!c)return!0;c=c.concat();let D=!0;for(let O=0;O<c.length;++O){const $=c[O];if($&&!$.da&&$.capture==d){const ie=$.listener,Fe=$.ha||$.src;$.fa&&ht(a.i,$),D=ie.call(Fe,y)!==!1&&D}}return D&&!y.defaultPrevented}function RT(a,c){if(typeof a!="function")if(a&&typeof a.handleEvent=="function")a=h(a.handleEvent,a);else throw Error("Invalid listener argument");return Number(c)>2147483647?-1:o.setTimeout(a,c||0)}function Zf(a){a.g=RT(()=>{a.g=null,a.i&&(a.i=!1,Zf(a))},a.l);const c=a.h;a.h=null,a.m.apply(null,c)}class kT extends A{constructor(c,d){super(),this.m=c,this.l=d,this.h=null,this.i=!1,this.g=null}j(c){this.h=arguments,this.g?this.i=!0:Zf(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Es(a){A.call(this),this.h=a,this.g={}}m(Es,A);var ep=[];function tp(a){Q(a.g,function(c,d){this.g.hasOwnProperty(d)&&Bu(c)},a),a.g={}}Es.prototype.N=function(){Es.Z.N.call(this),tp(this)},Es.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Wu=o.JSON.stringify,PT=o.JSON.parse,NT=class{stringify(a){return o.JSON.stringify(a,void 0)}parse(a){return o.JSON.parse(a,void 0)}};function np(){}function rp(){}var ws={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Hu(){C.call(this,"d")}m(Hu,C);function qu(){C.call(this,"c")}m(qu,C);var Or={},ip=null;function ca(){return ip=ip||new nt}Or.Ia="serverreachability";function sp(a){C.call(this,Or.Ia,a)}m(sp,C);function Ts(a){const c=ca();dt(c,new sp(c))}Or.STAT_EVENT="statevent";function op(a,c){C.call(this,Or.STAT_EVENT,a),this.stat=c}m(op,C);function ft(a){const c=ca();dt(c,new op(c,a))}Or.Ja="timingevent";function ap(a,c){C.call(this,Or.Ja,a),this.size=c}m(ap,C);function Is(a,c){if(typeof a!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){a()},c)}function Ss(){this.g=!0}Ss.prototype.ua=function(){this.g=!1};function xT(a,c,d,y,D,O){a.info(function(){if(a.g)if(O){var $="",ie=O.split("&");for(let me=0;me<ie.length;me++){var Fe=ie[me].split("=");if(Fe.length>1){const $e=Fe[0];Fe=Fe[1];const nn=$e.split("_");$=nn.length>=2&&nn[1]=="type"?$+($e+"="+Fe+"&"):$+($e+"=redacted&")}}}else $=null;else $=O;return"XMLHTTP REQ ("+y+") [attempt "+D+"]: "+c+`
`+d+`
`+$})}function bT(a,c,d,y,D,O,$){a.info(function(){return"XMLHTTP RESP ("+y+") [ attempt "+D+"]: "+c+`
`+d+`
`+O+" "+$})}function fi(a,c,d,y){a.info(function(){return"XMLHTTP TEXT ("+c+"): "+VT(a,d)+(y?" "+y:"")})}function DT(a,c){a.info(function(){return"TIMEOUT: "+c})}Ss.prototype.info=function(){};function VT(a,c){if(!a.g)return c;if(!c)return null;try{const O=JSON.parse(c);if(O){for(a=0;a<O.length;a++)if(Array.isArray(O[a])){var d=O[a];if(!(d.length<2)){var y=d[1];if(Array.isArray(y)&&!(y.length<1)){var D=y[0];if(D!="noop"&&D!="stop"&&D!="close")for(let $=1;$<y.length;$++)y[$]=""}}}}return Wu(O)}catch{return c}}var ha={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},lp={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},up;function Gu(){}m(Gu,np),Gu.prototype.g=function(){return new XMLHttpRequest},up=new Gu;function As(a){return encodeURIComponent(String(a))}function OT(a){var c=1;a=a.split(":");const d=[];for(;c>0&&a.length;)d.push(a.shift()),c--;return a.length&&d.push(a.join(":")),d}function Bn(a,c,d,y){this.j=a,this.i=c,this.l=d,this.S=y||1,this.V=new Es(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new cp}function cp(){this.i=null,this.g="",this.h=!1}var hp={},Ku={};function Qu(a,c,d){a.M=1,a.A=fa(tn(c)),a.u=d,a.R=!0,dp(a,null)}function dp(a,c){a.F=Date.now(),da(a),a.B=tn(a.A);var d=a.B,y=a.S;Array.isArray(y)||(y=[String(y)]),Ap(d.i,"t",y),a.C=0,d=a.j.L,a.h=new cp,a.g=$p(a.j,d?c:null,!a.u),a.P>0&&(a.O=new kT(h(a.Y,a,a.g),a.P)),c=a.V,d=a.g,y=a.ba;var D="readystatechange";Array.isArray(D)||(D&&(ep[0]=D.toString()),D=ep);for(let O=0;O<D.length;O++){const $=_s(d,D[O],y||c.handleEvent,!1,c.h||c);if(!$)break;c.g[$.key]=$}c=a.J?z(a.J):{},a.u?(a.v||(a.v="POST"),c["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.B,a.v,a.u,c)):(a.v="GET",a.g.ea(a.B,a.v,null,c)),Ts(),xT(a.i,a.v,a.B,a.l,a.S,a.u)}Bn.prototype.ba=function(a){a=a.target;const c=this.O;c&&Wn(a)==3?c.j():this.Y(a)},Bn.prototype.Y=function(a){try{if(a==this.g)e:{const ie=Wn(this.g),Fe=this.g.ya(),me=this.g.ca();if(!(ie<3)&&(ie!=3||this.g&&(this.h.h||this.g.la()||bp(this.g)))){this.K||ie!=4||Fe==7||(Fe==8||me<=0?Ts(3):Ts(2)),Yu(this);var c=this.g.ca();this.X=c;var d=LT(this);if(this.o=c==200,bT(this.i,this.v,this.B,this.l,this.S,ie,c),this.o){if(this.U&&!this.L){t:{if(this.g){var y,D=this.g;if((y=D.g?D.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!S(y)){var O=y;break t}}O=null}if(a=O)fi(this.i,this.l,a,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Xu(this,a);else{this.o=!1,this.m=3,ft(12),Lr(this),Cs(this);break e}}if(this.R){a=!0;let $e;for(;!this.K&&this.C<d.length;)if($e=MT(this,d),$e==Ku){ie==4&&(this.m=4,ft(14),a=!1),fi(this.i,this.l,null,"[Incomplete Response]");break}else if($e==hp){this.m=4,ft(15),fi(this.i,this.l,d,"[Invalid Chunk]"),a=!1;break}else fi(this.i,this.l,$e,null),Xu(this,$e);if(fp(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),ie!=4||d.length!=0||this.h.h||(this.m=1,ft(16),a=!1),this.o=this.o&&a,!a)fi(this.i,this.l,d,"[Invalid Chunked Response]"),Lr(this),Cs(this);else if(d.length>0&&!this.W){this.W=!0;var $=this.j;$.g==this&&$.aa&&!$.P&&($.j.info("Great, no buffering proxy detected. Bytes received: "+d.length),sc($),$.P=!0,ft(11))}}else fi(this.i,this.l,d,null),Xu(this,d);ie==4&&Lr(this),this.o&&!this.K&&(ie==4?Up(this.j,this):(this.o=!1,da(this)))}else XT(this.g),c==400&&d.indexOf("Unknown SID")>0?(this.m=3,ft(12)):(this.m=0,ft(13)),Lr(this),Cs(this)}}}catch{}finally{}};function LT(a){if(!fp(a))return a.g.la();const c=bp(a.g);if(c==="")return"";let d="";const y=c.length,D=Wn(a.g)==4;if(!a.h.i){if(typeof TextDecoder>"u")return Lr(a),Cs(a),"";a.h.i=new o.TextDecoder}for(let O=0;O<y;O++)a.h.h=!0,d+=a.h.i.decode(c[O],{stream:!(D&&O==y-1)});return c.length=0,a.h.g+=d,a.C=0,a.h.g}function fp(a){return a.g?a.v=="GET"&&a.M!=2&&a.j.Aa:!1}function MT(a,c){var d=a.C,y=c.indexOf(`
`,d);return y==-1?Ku:(d=Number(c.substring(d,y)),isNaN(d)?hp:(y+=1,y+d>c.length?Ku:(c=c.slice(y,y+d),a.C=y+d,c)))}Bn.prototype.cancel=function(){this.K=!0,Lr(this)};function da(a){a.T=Date.now()+a.H,pp(a,a.H)}function pp(a,c){if(a.D!=null)throw Error("WatchDog timer not null");a.D=Is(h(a.aa,a),c)}function Yu(a){a.D&&(o.clearTimeout(a.D),a.D=null)}Bn.prototype.aa=function(){this.D=null;const a=Date.now();a-this.T>=0?(DT(this.i,this.B),this.M!=2&&(Ts(),ft(17)),Lr(this),this.m=2,Cs(this)):pp(this,this.T-a)};function Cs(a){a.j.I==0||a.K||Up(a.j,a)}function Lr(a){Yu(a);var c=a.O;c&&typeof c.dispose=="function"&&c.dispose(),a.O=null,tp(a.V),a.g&&(c=a.g,a.g=null,c.abort(),c.dispose())}function Xu(a,c){try{var d=a.j;if(d.I!=0&&(d.g==a||Ju(d.h,a))){if(!a.L&&Ju(d.h,a)&&d.I==3){try{var y=d.Ba.g.parse(c)}catch{y=null}if(Array.isArray(y)&&y.length==3){var D=y;if(D[0]==0){e:if(!d.v){if(d.g)if(d.g.F+3e3<a.F)va(d),ga(d);else break e;ic(d),ft(18)}}else d.xa=D[1],0<d.xa-d.K&&D[2]<37500&&d.F&&d.A==0&&!d.C&&(d.C=Is(h(d.Va,d),6e3));yp(d.h)<=1&&d.ta&&(d.ta=void 0)}else Fr(d,11)}else if((a.L||d.g==a)&&va(d),!S(c))for(D=d.Ba.g.parse(c),c=0;c<D.length;c++){let me=D[c];const $e=me[0];if(!($e<=d.K))if(d.K=$e,me=me[1],d.I==2)if(me[0]=="c"){d.M=me[1],d.ba=me[2];const nn=me[3];nn!=null&&(d.ka=nn,d.j.info("VER="+d.ka));const Ur=me[4];Ur!=null&&(d.za=Ur,d.j.info("SVER="+d.za));const Hn=me[5];Hn!=null&&typeof Hn=="number"&&Hn>0&&(y=1.5*Hn,d.O=y,d.j.info("backChannelRequestTimeoutMs_="+y)),y=d;const qn=a.g;if(qn){const Ea=qn.g?qn.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Ea){var O=y.h;O.g||Ea.indexOf("spdy")==-1&&Ea.indexOf("quic")==-1&&Ea.indexOf("h2")==-1||(O.j=O.l,O.g=new Set,O.h&&(Zu(O,O.h),O.h=null))}if(y.G){const oc=qn.g?qn.g.getResponseHeader("X-HTTP-Session-Id"):null;oc&&(y.wa=oc,_e(y.J,y.G,oc))}}d.I=3,d.l&&d.l.ra(),d.aa&&(d.T=Date.now()-a.F,d.j.info("Handshake RTT: "+d.T+"ms")),y=d;var $=a;if(y.na=jp(y,y.L?y.ba:null,y.W),$.L){vp(y.h,$);var ie=$,Fe=y.O;Fe&&(ie.H=Fe),ie.D&&(Yu(ie),da(ie)),y.g=$}else Mp(y);d.i.length>0&&ya(d)}else me[0]!="stop"&&me[0]!="close"||Fr(d,7);else d.I==3&&(me[0]=="stop"||me[0]=="close"?me[0]=="stop"?Fr(d,7):rc(d):me[0]!="noop"&&d.l&&d.l.qa(me),d.A=0)}}Ts(4)}catch{}}var FT=class{constructor(a,c){this.g=a,this.map=c}};function mp(a){this.l=a||10,o.PerformanceNavigationTiming?(a=o.performance.getEntriesByType("navigation"),a=a.length>0&&(a[0].nextHopProtocol=="hq"||a[0].nextHopProtocol=="h2")):a=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=a?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function gp(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function yp(a){return a.h?1:a.g?a.g.size:0}function Ju(a,c){return a.h?a.h==c:a.g?a.g.has(c):!1}function Zu(a,c){a.g?a.g.add(c):a.h=c}function vp(a,c){a.h&&a.h==c?a.h=null:a.g&&a.g.has(c)&&a.g.delete(c)}mp.prototype.cancel=function(){if(this.i=_p(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const a of this.g.values())a.cancel();this.g.clear()}};function _p(a){if(a.h!=null)return a.i.concat(a.h.G);if(a.g!=null&&a.g.size!==0){let c=a.i;for(const d of a.g.values())c=c.concat(d.G);return c}return _(a.i)}var Ep=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function UT(a,c){if(a){a=a.split("&");for(let d=0;d<a.length;d++){const y=a[d].indexOf("=");let D,O=null;y>=0?(D=a[d].substring(0,y),O=a[d].substring(y+1)):D=a[d],c(D,O?decodeURIComponent(O.replace(/\+/g," ")):"")}}}function jn(a){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let c;a instanceof jn?(this.l=a.l,Rs(this,a.j),this.o=a.o,this.g=a.g,ks(this,a.u),this.h=a.h,ec(this,Cp(a.i)),this.m=a.m):a&&(c=String(a).match(Ep))?(this.l=!1,Rs(this,c[1]||"",!0),this.o=Ps(c[2]||""),this.g=Ps(c[3]||"",!0),ks(this,c[4]),this.h=Ps(c[5]||"",!0),ec(this,c[6]||"",!0),this.m=Ps(c[7]||"")):(this.l=!1,this.i=new xs(null,this.l))}jn.prototype.toString=function(){const a=[];var c=this.j;c&&a.push(Ns(c,wp,!0),":");var d=this.g;return(d||c=="file")&&(a.push("//"),(c=this.o)&&a.push(Ns(c,wp,!0),"@"),a.push(As(d).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.u,d!=null&&a.push(":",String(d))),(d=this.h)&&(this.g&&d.charAt(0)!="/"&&a.push("/"),a.push(Ns(d,d.charAt(0)=="/"?jT:BT,!0))),(d=this.i.toString())&&a.push("?",d),(d=this.m)&&a.push("#",Ns(d,WT)),a.join("")},jn.prototype.resolve=function(a){const c=tn(this);let d=!!a.j;d?Rs(c,a.j):d=!!a.o,d?c.o=a.o:d=!!a.g,d?c.g=a.g:d=a.u!=null;var y=a.h;if(d)ks(c,a.u);else if(d=!!a.h){if(y.charAt(0)!="/")if(this.g&&!this.h)y="/"+y;else{var D=c.h.lastIndexOf("/");D!=-1&&(y=c.h.slice(0,D+1)+y)}if(D=y,D==".."||D==".")y="";else if(D.indexOf("./")!=-1||D.indexOf("/.")!=-1){y=D.lastIndexOf("/",0)==0,D=D.split("/");const O=[];for(let $=0;$<D.length;){const ie=D[$++];ie=="."?y&&$==D.length&&O.push(""):ie==".."?((O.length>1||O.length==1&&O[0]!="")&&O.pop(),y&&$==D.length&&O.push("")):(O.push(ie),y=!0)}y=O.join("/")}else y=D}return d?c.h=y:d=a.i.toString()!=="",d?ec(c,Cp(a.i)):d=!!a.m,d&&(c.m=a.m),c};function tn(a){return new jn(a)}function Rs(a,c,d){a.j=d?Ps(c,!0):c,a.j&&(a.j=a.j.replace(/:$/,""))}function ks(a,c){if(c){if(c=Number(c),isNaN(c)||c<0)throw Error("Bad port number "+c);a.u=c}else a.u=null}function ec(a,c,d){c instanceof xs?(a.i=c,HT(a.i,a.l)):(d||(c=Ns(c,$T)),a.i=new xs(c,a.l))}function _e(a,c,d){a.i.set(c,d)}function fa(a){return _e(a,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),a}function Ps(a,c){return a?c?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function Ns(a,c,d){return typeof a=="string"?(a=encodeURI(a).replace(c,zT),d&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function zT(a){return a=a.charCodeAt(0),"%"+(a>>4&15).toString(16)+(a&15).toString(16)}var wp=/[#\/\?@]/g,BT=/[#\?:]/g,jT=/[#\?]/g,$T=/[#\?@]/g,WT=/#/g;function xs(a,c){this.h=this.g=null,this.i=a||null,this.j=!!c}function Mr(a){a.g||(a.g=new Map,a.h=0,a.i&&UT(a.i,function(c,d){a.add(decodeURIComponent(c.replace(/\+/g," ")),d)}))}t=xs.prototype,t.add=function(a,c){Mr(this),this.i=null,a=pi(this,a);let d=this.g.get(a);return d||this.g.set(a,d=[]),d.push(c),this.h+=1,this};function Tp(a,c){Mr(a),c=pi(a,c),a.g.has(c)&&(a.i=null,a.h-=a.g.get(c).length,a.g.delete(c))}function Ip(a,c){return Mr(a),c=pi(a,c),a.g.has(c)}t.forEach=function(a,c){Mr(this),this.g.forEach(function(d,y){d.forEach(function(D){a.call(c,D,y,this)},this)},this)};function Sp(a,c){Mr(a);let d=[];if(typeof c=="string")Ip(a,c)&&(d=d.concat(a.g.get(pi(a,c))));else for(a=Array.from(a.g.values()),c=0;c<a.length;c++)d=d.concat(a[c]);return d}t.set=function(a,c){return Mr(this),this.i=null,a=pi(this,a),Ip(this,a)&&(this.h-=this.g.get(a).length),this.g.set(a,[c]),this.h+=1,this},t.get=function(a,c){return a?(a=Sp(this,a),a.length>0?String(a[0]):c):c};function Ap(a,c,d){Tp(a,c),d.length>0&&(a.i=null,a.g.set(pi(a,c),_(d)),a.h+=d.length)}t.toString=function(){if(this.i)return this.i;if(!this.g)return"";const a=[],c=Array.from(this.g.keys());for(let y=0;y<c.length;y++){var d=c[y];const D=As(d);d=Sp(this,d);for(let O=0;O<d.length;O++){let $=D;d[O]!==""&&($+="="+As(d[O])),a.push($)}}return this.i=a.join("&")};function Cp(a){const c=new xs;return c.i=a.i,a.g&&(c.g=new Map(a.g),c.h=a.h),c}function pi(a,c){return c=String(c),a.j&&(c=c.toLowerCase()),c}function HT(a,c){c&&!a.j&&(Mr(a),a.i=null,a.g.forEach(function(d,y){const D=y.toLowerCase();y!=D&&(Tp(this,y),Ap(this,D,d))},a)),a.j=c}function qT(a,c){const d=new Ss;if(o.Image){const y=new Image;y.onload=p($n,d,"TestLoadImage: loaded",!0,c,y),y.onerror=p($n,d,"TestLoadImage: error",!1,c,y),y.onabort=p($n,d,"TestLoadImage: abort",!1,c,y),y.ontimeout=p($n,d,"TestLoadImage: timeout",!1,c,y),o.setTimeout(function(){y.ontimeout&&y.ontimeout()},1e4),y.src=a}else c(!1)}function GT(a,c){const d=new Ss,y=new AbortController,D=setTimeout(()=>{y.abort(),$n(d,"TestPingServer: timeout",!1,c)},1e4);fetch(a,{signal:y.signal}).then(O=>{clearTimeout(D),O.ok?$n(d,"TestPingServer: ok",!0,c):$n(d,"TestPingServer: server error",!1,c)}).catch(()=>{clearTimeout(D),$n(d,"TestPingServer: error",!1,c)})}function $n(a,c,d,y,D){try{D&&(D.onload=null,D.onerror=null,D.onabort=null,D.ontimeout=null),y(d)}catch{}}function KT(){this.g=new NT}function tc(a){this.i=a.Sb||null,this.h=a.ab||!1}m(tc,np),tc.prototype.g=function(){return new pa(this.i,this.h)};function pa(a,c){nt.call(this),this.H=a,this.o=c,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}m(pa,nt),t=pa.prototype,t.open=function(a,c){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=a,this.D=c,this.readyState=1,Ds(this)},t.send=function(a){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const c={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};a&&(c.body=a),(this.H||o).fetch(new Request(this.D,c)).then(this.Pa.bind(this),this.ga.bind(this))},t.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,bs(this)),this.readyState=0},t.Pa=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,Ds(this)),this.g&&(this.readyState=3,Ds(this),this.g)))if(this.responseType==="arraybuffer")a.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in a){if(this.j=a.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Rp(this)}else a.text().then(this.Oa.bind(this),this.ga.bind(this))};function Rp(a){a.j.read().then(a.Ma.bind(a)).catch(a.ga.bind(a))}t.Ma=function(a){if(this.g){if(this.o&&a.value)this.response.push(a.value);else if(!this.o){var c=a.value?a.value:new Uint8Array(0);(c=this.B.decode(c,{stream:!a.done}))&&(this.response=this.responseText+=c)}a.done?bs(this):Ds(this),this.readyState==3&&Rp(this)}},t.Oa=function(a){this.g&&(this.response=this.responseText=a,bs(this))},t.Na=function(a){this.g&&(this.response=a,bs(this))},t.ga=function(){this.g&&bs(this)};function bs(a){a.readyState=4,a.l=null,a.j=null,a.B=null,Ds(a)}t.setRequestHeader=function(a,c){this.A.append(a,c)},t.getResponseHeader=function(a){return this.h&&this.h.get(a.toLowerCase())||""},t.getAllResponseHeaders=function(){if(!this.h)return"";const a=[],c=this.h.entries();for(var d=c.next();!d.done;)d=d.value,a.push(d[0]+": "+d[1]),d=c.next();return a.join(`\r
`)};function Ds(a){a.onreadystatechange&&a.onreadystatechange.call(a)}Object.defineProperty(pa.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(a){this.m=a?"include":"same-origin"}});function kp(a){let c="";return Q(a,function(d,y){c+=y,c+=":",c+=d,c+=`\r
`}),c}function nc(a,c,d){e:{for(y in d){var y=!1;break e}y=!0}y||(d=kp(d),typeof a=="string"?d!=null&&As(d):_e(a,c,d))}function Ne(a){nt.call(this),this.headers=new Map,this.L=a||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}m(Ne,nt);var QT=/^https?$/i,YT=["POST","PUT"];t=Ne.prototype,t.Fa=function(a){this.H=a},t.ea=function(a,c,d,y){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+a);c=c?c.toUpperCase():"GET",this.D=a,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():up.g(),this.g.onreadystatechange=g(h(this.Ca,this));try{this.B=!0,this.g.open(c,String(a),!0),this.B=!1}catch(O){Pp(this,O);return}if(a=d||"",d=new Map(this.headers),y)if(Object.getPrototypeOf(y)===Object.prototype)for(var D in y)d.set(D,y[D]);else if(typeof y.keys=="function"&&typeof y.get=="function")for(const O of y.keys())d.set(O,y.get(O));else throw Error("Unknown input type for opt_headers: "+String(y));y=Array.from(d.keys()).find(O=>O.toLowerCase()=="content-type"),D=o.FormData&&a instanceof o.FormData,!(Array.prototype.indexOf.call(YT,c,void 0)>=0)||y||D||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[O,$]of d)this.g.setRequestHeader(O,$);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(a),this.v=!1}catch(O){Pp(this,O)}};function Pp(a,c){a.h=!1,a.g&&(a.j=!0,a.g.abort(),a.j=!1),a.l=c,a.o=5,Np(a),ma(a)}function Np(a){a.A||(a.A=!0,dt(a,"complete"),dt(a,"error"))}t.abort=function(a){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=a||7,dt(this,"complete"),dt(this,"abort"),ma(this))},t.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),ma(this,!0)),Ne.Z.N.call(this)},t.Ca=function(){this.u||(this.B||this.v||this.j?xp(this):this.Xa())},t.Xa=function(){xp(this)};function xp(a){if(a.h&&typeof s<"u"){if(a.v&&Wn(a)==4)setTimeout(a.Ca.bind(a),0);else if(dt(a,"readystatechange"),Wn(a)==4){a.h=!1;try{const O=a.ca();e:switch(O){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var c=!0;break e;default:c=!1}var d;if(!(d=c)){var y;if(y=O===0){let $=String(a.D).match(Ep)[1]||null;!$&&o.self&&o.self.location&&($=o.self.location.protocol.slice(0,-1)),y=!QT.test($?$.toLowerCase():"")}d=y}if(d)dt(a,"complete"),dt(a,"success");else{a.o=6;try{var D=Wn(a)>2?a.g.statusText:""}catch{D=""}a.l=D+" ["+a.ca()+"]",Np(a)}}finally{ma(a)}}}}function ma(a,c){if(a.g){a.m&&(clearTimeout(a.m),a.m=null);const d=a.g;a.g=null,c||dt(a,"ready");try{d.onreadystatechange=null}catch{}}}t.isActive=function(){return!!this.g};function Wn(a){return a.g?a.g.readyState:0}t.ca=function(){try{return Wn(this)>2?this.g.status:-1}catch{return-1}},t.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},t.La=function(a){if(this.g){var c=this.g.responseText;return a&&c.indexOf(a)==0&&(c=c.substring(a.length)),PT(c)}};function bp(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.F){case"":case"text":return a.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch{return null}}function XT(a){const c={};a=(a.g&&Wn(a)>=2&&a.g.getAllResponseHeaders()||"").split(`\r
`);for(let y=0;y<a.length;y++){if(S(a[y]))continue;var d=OT(a[y]);const D=d[0];if(d=d[1],typeof d!="string")continue;d=d.trim();const O=c[D]||[];c[D]=O,O.push(d)}X(c,function(y){return y.join(", ")})}t.ya=function(){return this.o},t.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Vs(a,c,d){return d&&d.internalChannelParams&&d.internalChannelParams[a]||c}function Dp(a){this.za=0,this.i=[],this.j=new Ss,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Vs("failFast",!1,a),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Vs("baseRetryDelayMs",5e3,a),this.Za=Vs("retryDelaySeedMs",1e4,a),this.Ta=Vs("forwardChannelMaxRetries",2,a),this.va=Vs("forwardChannelRequestTimeoutMs",2e4,a),this.ma=a&&a.xmlHttpFactory||void 0,this.Ua=a&&a.Rb||void 0,this.Aa=a&&a.useFetchStreams||!1,this.O=void 0,this.L=a&&a.supportsCrossDomainXhr||!1,this.M="",this.h=new mp(a&&a.concurrentRequestLimit),this.Ba=new KT,this.S=a&&a.fastHandshake||!1,this.R=a&&a.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=a&&a.Pb||!1,a&&a.ua&&this.j.ua(),a&&a.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&a&&a.detectBufferingProxy||!1,this.ia=void 0,a&&a.longPollingTimeout&&a.longPollingTimeout>0&&(this.ia=a.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}t=Dp.prototype,t.ka=8,t.I=1,t.connect=function(a,c,d,y){ft(0),this.W=a,this.H=c||{},d&&y!==void 0&&(this.H.OSID=d,this.H.OAID=y),this.F=this.X,this.J=jp(this,null,this.W),ya(this)};function rc(a){if(Vp(a),a.I==3){var c=a.V++,d=tn(a.J);if(_e(d,"SID",a.M),_e(d,"RID",c),_e(d,"TYPE","terminate"),Os(a,d),c=new Bn(a,a.j,c),c.M=2,c.A=fa(tn(d)),d=!1,o.navigator&&o.navigator.sendBeacon)try{d=o.navigator.sendBeacon(c.A.toString(),"")}catch{}!d&&o.Image&&(new Image().src=c.A,d=!0),d||(c.g=$p(c.j,null),c.g.ea(c.A)),c.F=Date.now(),da(c)}Bp(a)}function ga(a){a.g&&(sc(a),a.g.cancel(),a.g=null)}function Vp(a){ga(a),a.v&&(o.clearTimeout(a.v),a.v=null),va(a),a.h.cancel(),a.m&&(typeof a.m=="number"&&o.clearTimeout(a.m),a.m=null)}function ya(a){if(!gp(a.h)&&!a.m){a.m=!0;var c=a.Ea;V||v(),M||(V(),M=!0),w.add(c,a),a.D=0}}function JT(a,c){return yp(a.h)>=a.h.j-(a.m?1:0)?!1:a.m?(a.i=c.G.concat(a.i),!0):a.I==1||a.I==2||a.D>=(a.Sa?0:a.Ta)?!1:(a.m=Is(h(a.Ea,a,c),zp(a,a.D)),a.D++,!0)}t.Ea=function(a){if(this.m)if(this.m=null,this.I==1){if(!a){this.V=Math.floor(Math.random()*1e5),a=this.V++;const D=new Bn(this,this.j,a);let O=this.o;if(this.U&&(O?(O=z(O),Se(O,this.U)):O=this.U),this.u!==null||this.R||(D.J=O,O=null),this.S)e:{for(var c=0,d=0;d<this.i.length;d++){t:{var y=this.i[d];if("__data__"in y.map&&(y=y.map.__data__,typeof y=="string")){y=y.length;break t}y=void 0}if(y===void 0)break;if(c+=y,c>4096){c=d;break e}if(c===4096||d===this.i.length-1){c=d+1;break e}}c=1e3}else c=1e3;c=Lp(this,D,c),d=tn(this.J),_e(d,"RID",a),_e(d,"CVER",22),this.G&&_e(d,"X-HTTP-Session-Id",this.G),Os(this,d),O&&(this.R?c="headers="+As(kp(O))+"&"+c:this.u&&nc(d,this.u,O)),Zu(this.h,D),this.Ra&&_e(d,"TYPE","init"),this.S?(_e(d,"$req",c),_e(d,"SID","null"),D.U=!0,Qu(D,d,null)):Qu(D,d,c),this.I=2}}else this.I==3&&(a?Op(this,a):this.i.length==0||gp(this.h)||Op(this))};function Op(a,c){var d;c?d=c.l:d=a.V++;const y=tn(a.J);_e(y,"SID",a.M),_e(y,"RID",d),_e(y,"AID",a.K),Os(a,y),a.u&&a.o&&nc(y,a.u,a.o),d=new Bn(a,a.j,d,a.D+1),a.u===null&&(d.J=a.o),c&&(a.i=c.G.concat(a.i)),c=Lp(a,d,1e3),d.H=Math.round(a.va*.5)+Math.round(a.va*.5*Math.random()),Zu(a.h,d),Qu(d,y,c)}function Os(a,c){a.H&&Q(a.H,function(d,y){_e(c,y,d)}),a.l&&Q({},function(d,y){_e(c,y,d)})}function Lp(a,c,d){d=Math.min(a.i.length,d);const y=a.l?h(a.l.Ka,a.l,a):null;e:{var D=a.i;let ie=-1;for(;;){const Fe=["count="+d];ie==-1?d>0?(ie=D[0].g,Fe.push("ofs="+ie)):ie=0:Fe.push("ofs="+ie);let me=!0;for(let $e=0;$e<d;$e++){var O=D[$e].g;const nn=D[$e].map;if(O-=ie,O<0)ie=Math.max(0,D[$e].g-100),me=!1;else try{O="req"+O+"_"||"";try{var $=nn instanceof Map?nn:Object.entries(nn);for(const[Ur,Hn]of $){let qn=Hn;l(Hn)&&(qn=Wu(Hn)),Fe.push(O+Ur+"="+encodeURIComponent(qn))}}catch(Ur){throw Fe.push(O+"type="+encodeURIComponent("_badmap")),Ur}}catch{y&&y(nn)}}if(me){$=Fe.join("&");break e}}$=void 0}return a=a.i.splice(0,d),c.G=a,$}function Mp(a){if(!a.g&&!a.v){a.Y=1;var c=a.Da;V||v(),M||(V(),M=!0),w.add(c,a),a.A=0}}function ic(a){return a.g||a.v||a.A>=3?!1:(a.Y++,a.v=Is(h(a.Da,a),zp(a,a.A)),a.A++,!0)}t.Da=function(){if(this.v=null,Fp(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var a=4*this.T;this.j.info("BP detection timer enabled: "+a),this.B=Is(h(this.Wa,this),a)}},t.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,ft(10),ga(this),Fp(this))};function sc(a){a.B!=null&&(o.clearTimeout(a.B),a.B=null)}function Fp(a){a.g=new Bn(a,a.j,"rpc",a.Y),a.u===null&&(a.g.J=a.o),a.g.P=0;var c=tn(a.na);_e(c,"RID","rpc"),_e(c,"SID",a.M),_e(c,"AID",a.K),_e(c,"CI",a.F?"0":"1"),!a.F&&a.ia&&_e(c,"TO",a.ia),_e(c,"TYPE","xmlhttp"),Os(a,c),a.u&&a.o&&nc(c,a.u,a.o),a.O&&(a.g.H=a.O);var d=a.g;a=a.ba,d.M=1,d.A=fa(tn(c)),d.u=null,d.R=!0,dp(d,a)}t.Va=function(){this.C!=null&&(this.C=null,ga(this),ic(this),ft(19))};function va(a){a.C!=null&&(o.clearTimeout(a.C),a.C=null)}function Up(a,c){var d=null;if(a.g==c){va(a),sc(a),a.g=null;var y=2}else if(Ju(a.h,c))d=c.G,vp(a.h,c),y=1;else return;if(a.I!=0){if(c.o)if(y==1){d=c.u?c.u.length:0,c=Date.now()-c.F;var D=a.D;y=ca(),dt(y,new ap(y,d)),ya(a)}else Mp(a);else if(D=c.m,D==3||D==0&&c.X>0||!(y==1&&JT(a,c)||y==2&&ic(a)))switch(d&&d.length>0&&(c=a.h,c.i=c.i.concat(d)),D){case 1:Fr(a,5);break;case 4:Fr(a,10);break;case 3:Fr(a,6);break;default:Fr(a,2)}}}function zp(a,c){let d=a.Qa+Math.floor(Math.random()*a.Za);return a.isActive()||(d*=2),d*c}function Fr(a,c){if(a.j.info("Error code "+c),c==2){var d=h(a.bb,a),y=a.Ua;const D=!y;y=new jn(y||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||Rs(y,"https"),fa(y),D?qT(y.toString(),d):GT(y.toString(),d)}else ft(2);a.I=0,a.l&&a.l.pa(c),Bp(a),Vp(a)}t.bb=function(a){a?(this.j.info("Successfully pinged google.com"),ft(2)):(this.j.info("Failed to ping google.com"),ft(1))};function Bp(a){if(a.I=0,a.ja=[],a.l){const c=_p(a.h);(c.length!=0||a.i.length!=0)&&(N(a.ja,c),N(a.ja,a.i),a.h.i.length=0,_(a.i),a.i.length=0),a.l.oa()}}function jp(a,c,d){var y=d instanceof jn?tn(d):new jn(d);if(y.g!="")c&&(y.g=c+"."+y.g),ks(y,y.u);else{var D=o.location;y=D.protocol,c=c?c+"."+D.hostname:D.hostname,D=+D.port;const O=new jn(null);y&&Rs(O,y),c&&(O.g=c),D&&ks(O,D),d&&(O.h=d),y=O}return d=a.G,c=a.wa,d&&c&&_e(y,d,c),_e(y,"VER",a.ka),Os(a,y),y}function $p(a,c,d){if(c&&!a.L)throw Error("Can't create secondary domain capable XhrIo object.");return c=a.Aa&&!a.ma?new Ne(new tc({ab:d})):new Ne(a.ma),c.Fa(a.L),c}t.isActive=function(){return!!this.l&&this.l.isActive(this)};function Wp(){}t=Wp.prototype,t.ra=function(){},t.qa=function(){},t.pa=function(){},t.oa=function(){},t.isActive=function(){return!0},t.Ka=function(){};function _a(){}_a.prototype.g=function(a,c){return new Ct(a,c)};function Ct(a,c){nt.call(this),this.g=new Dp(c),this.l=a,this.h=c&&c.messageUrlParams||null,a=c&&c.messageHeaders||null,c&&c.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"}),this.g.o=a,a=c&&c.initMessageHeaders||null,c&&c.messageContentType&&(a?a["X-WebChannel-Content-Type"]=c.messageContentType:a={"X-WebChannel-Content-Type":c.messageContentType}),c&&c.sa&&(a?a["X-WebChannel-Client-Profile"]=c.sa:a={"X-WebChannel-Client-Profile":c.sa}),this.g.U=a,(a=c&&c.Qb)&&!S(a)&&(this.g.u=a),this.A=c&&c.supportsCrossDomainXhr||!1,this.v=c&&c.sendRawJson||!1,(c=c&&c.httpSessionIdParam)&&!S(c)&&(this.g.G=c,a=this.h,a!==null&&c in a&&(a=this.h,c in a&&delete a[c])),this.j=new mi(this)}m(Ct,nt),Ct.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Ct.prototype.close=function(){rc(this.g)},Ct.prototype.o=function(a){var c=this.g;if(typeof a=="string"){var d={};d.__data__=a,a=d}else this.v&&(d={},d.__data__=Wu(a),a=d);c.i.push(new FT(c.Ya++,a)),c.I==3&&ya(c)},Ct.prototype.N=function(){this.g.l=null,delete this.j,rc(this.g),delete this.g,Ct.Z.N.call(this)};function Hp(a){Hu.call(this),a.__headers__&&(this.headers=a.__headers__,this.statusCode=a.__status__,delete a.__headers__,delete a.__status__);var c=a.__sm__;if(c){e:{for(const d in c){a=d;break e}a=void 0}(this.i=a)&&(a=this.i,c=c!==null&&a in c?c[a]:void 0),this.data=c}else this.data=a}m(Hp,Hu);function qp(){qu.call(this),this.status=1}m(qp,qu);function mi(a){this.g=a}m(mi,Wp),mi.prototype.ra=function(){dt(this.g,"a")},mi.prototype.qa=function(a){dt(this.g,new Hp(a))},mi.prototype.pa=function(a){dt(this.g,new qp)},mi.prototype.oa=function(){dt(this.g,"b")},_a.prototype.createWebChannel=_a.prototype.g,Ct.prototype.send=Ct.prototype.o,Ct.prototype.open=Ct.prototype.m,Ct.prototype.close=Ct.prototype.close,uE=function(){return new _a},lE=function(){return ca()},aE=Or,jh={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},ha.NO_ERROR=0,ha.TIMEOUT=8,ha.HTTP_ERROR=6,il=ha,lp.COMPLETE="complete",oE=lp,rp.EventType=ws,ws.OPEN="a",ws.CLOSE="b",ws.ERROR="c",ws.MESSAGE="d",nt.prototype.listen=nt.prototype.J,Js=rp,Ne.prototype.listenOnce=Ne.prototype.K,Ne.prototype.getLastError=Ne.prototype.Ha,Ne.prototype.getLastErrorCode=Ne.prototype.ya,Ne.prototype.getStatus=Ne.prototype.ca,Ne.prototype.getResponseJson=Ne.prototype.La,Ne.prototype.getResponseText=Ne.prototype.la,Ne.prototype.send=Ne.prototype.ea,Ne.prototype.setWithCredentials=Ne.prototype.Fa,sE=Ne}).apply(typeof Fa<"u"?Fa:typeof self<"u"?self:typeof window<"u"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}ot.UNAUTHENTICATED=new ot(null),ot.GOOGLE_CREDENTIALS=new ot("google-credentials-uid"),ot.FIRST_PARTY=new ot("first-party-uid"),ot.MOCK_USER=new ot("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ds="12.11.0";function sA(t){ds=t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ri=new nf("@firebase/firestore");function yi(){return ri.logLevel}function H(t,...e){if(ri.logLevel<=le.DEBUG){const n=e.map(of);ri.debug(`Firestore (${ds}): ${t}`,...n)}}function Vn(t,...e){if(ri.logLevel<=le.ERROR){const n=e.map(of);ri.error(`Firestore (${ds}): ${t}`,...n)}}function ii(t,...e){if(ri.logLevel<=le.WARN){const n=e.map(of);ri.warn(`Firestore (${ds}): ${t}`,...n)}}function of(t){if(typeof t=="string")return t;try{return function(n){return JSON.stringify(n)}(t)}catch{return t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ee(t,e,n){let r="Unexpected state";typeof e=="string"?r=e:n=e,cE(t,r,n)}function cE(t,e,n){let r=`FIRESTORE (${ds}) INTERNAL ASSERTION FAILED: ${e} (ID: ${t.toString(16)})`;if(n!==void 0)try{r+=" CONTEXT: "+JSON.stringify(n)}catch{r+=" CONTEXT: "+n}throw Vn(r),new Error(r)}function fe(t,e,n,r){let i="Unexpected state";typeof n=="string"?i=n:r=n,t||cE(e,i,r)}function ne(t,e){return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const U={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class K extends Fn{constructor(e,n){super(e,n),this.code=e,this.message=n,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cn{constructor(){this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hE{constructor(e,n){this.user=n,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class oA{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,n){e.enqueueRetryable(()=>n(ot.UNAUTHENTICATED))}shutdown(){}}class aA{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,n){this.changeListener=n,e.enqueueRetryable(()=>n(this.token.user))}shutdown(){this.changeListener=null}}class lA{constructor(e){this.t=e,this.currentUser=ot.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,n){fe(this.o===void 0,42304);let r=this.i;const i=u=>this.i!==r?(r=this.i,n(u)):Promise.resolve();let s=new Cn;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new Cn,e.enqueueRetryable(()=>i(this.currentUser))};const o=()=>{const u=s;e.enqueueRetryable(async()=>{await u.promise,await i(this.currentUser)})},l=u=>{H("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit(u=>l(u)),setTimeout(()=>{if(!this.auth){const u=this.t.getImmediate({optional:!0});u?l(u):(H("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new Cn)}},0),o()}getToken(){const e=this.i,n=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(n).then(r=>this.i!==e?(H("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(fe(typeof r.accessToken=="string",31837,{l:r}),new hE(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return fe(e===null||typeof e=="string",2055,{h:e}),new ot(e)}}class uA{constructor(e,n,r){this.P=e,this.T=n,this.I=r,this.type="FirstParty",this.user=ot.FIRST_PARTY,this.R=new Map}A(){return this.I?this.I():null}get headers(){this.R.set("X-Goog-AuthUser",this.P);const e=this.A();return e&&this.R.set("Authorization",e),this.T&&this.R.set("X-Goog-Iam-Authorization-Token",this.T),this.R}}class cA{constructor(e,n,r){this.P=e,this.T=n,this.I=r}getToken(){return Promise.resolve(new uA(this.P,this.T,this.I))}start(e,n){e.enqueueRetryable(()=>n(ot.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class mg{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class hA{constructor(e,n){this.V=n,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Mt(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,n){fe(this.o===void 0,3512);const r=s=>{s.error!=null&&H("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${s.error.message}`);const o=s.token!==this.m;return this.m=s.token,H("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?n(s.token):Promise.resolve()};this.o=s=>{e.enqueueRetryable(()=>r(s))};const i=s=>{H("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=s,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(s=>i(s)),setTimeout(()=>{if(!this.appCheck){const s=this.V.getImmediate({optional:!0});s?i(s):H("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new mg(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(n=>n?(fe(typeof n.token=="string",44558,{tokenResult:n}),this.m=n.token,new mg(n.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dA(t){const e=typeof self<"u"&&(self.crypto||self.msCrypto),n=new Uint8Array(t);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(n);else for(let r=0;r<t;r++)n[r]=Math.floor(256*Math.random());return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class af{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",n=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const i=dA(40);for(let s=0;s<i.length;++s)r.length<20&&i[s]<n&&(r+=e.charAt(i[s]%62))}return r}}function ue(t,e){return t<e?-1:t>e?1:0}function $h(t,e){const n=Math.min(t.length,e.length);for(let r=0;r<n;r++){const i=t.charAt(r),s=e.charAt(r);if(i!==s)return Fc(i)===Fc(s)?ue(i,s):Fc(i)?1:-1}return ue(t.length,e.length)}const fA=55296,pA=57343;function Fc(t){const e=t.charCodeAt(0);return e>=fA&&e<=pA}function ts(t,e,n){return t.length===e.length&&t.every((r,i)=>n(r,e[i]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gg="__name__";class on{constructor(e,n,r){n===void 0?n=0:n>e.length&&ee(637,{offset:n,range:e.length}),r===void 0?r=e.length-n:r>e.length-n&&ee(1746,{length:r,range:e.length-n}),this.segments=e,this.offset=n,this.len=r}get length(){return this.len}isEqual(e){return on.comparator(this,e)===0}child(e){const n=this.segments.slice(this.offset,this.limit());return e instanceof on?e.forEach(r=>{n.push(r)}):n.push(e),this.construct(n)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let n=0;n<this.length;n++)if(this.get(n)!==e.get(n))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let n=0;n<this.length;n++)if(this.get(n)!==e.get(n))return!1;return!0}forEach(e){for(let n=this.offset,r=this.limit();n<r;n++)e(this.segments[n])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,n){const r=Math.min(e.length,n.length);for(let i=0;i<r;i++){const s=on.compareSegments(e.get(i),n.get(i));if(s!==0)return s}return ue(e.length,n.length)}static compareSegments(e,n){const r=on.isNumericId(e),i=on.isNumericId(n);return r&&!i?-1:!r&&i?1:r&&i?on.extractNumericId(e).compare(on.extractNumericId(n)):$h(e,n)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return yr.fromString(e.substring(4,e.length-2))}}class we extends on{construct(e,n,r){return new we(e,n,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const n=[];for(const r of e){if(r.indexOf("//")>=0)throw new K(U.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);n.push(...r.split("/").filter(i=>i.length>0))}return new we(n)}static emptyPath(){return new we([])}}const mA=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class Ye extends on{construct(e,n,r){return new Ye(e,n,r)}static isValidIdentifier(e){return mA.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Ye.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===gg}static keyField(){return new Ye([gg])}static fromServerFormat(e){const n=[];let r="",i=0;const s=()=>{if(r.length===0)throw new K(U.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);n.push(r),r=""};let o=!1;for(;i<e.length;){const l=e[i];if(l==="\\"){if(i+1===e.length)throw new K(U.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[i+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new K(U.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=u,i+=2}else l==="`"?(o=!o,i++):l!=="."||o?(r+=l,i++):(s(),i++)}if(s(),o)throw new K(U.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Ye(n)}static emptyPath(){return new Ye([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Y{constructor(e){this.path=e}static fromPath(e){return new Y(we.fromString(e))}static fromName(e){return new Y(we.fromString(e).popFirst(5))}static empty(){return new Y(we.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&we.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,n){return we.comparator(e.path,n.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new Y(new we(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dE(t,e,n){if(!n)throw new K(U.INVALID_ARGUMENT,`Function ${t}() cannot be called with an empty ${e}.`)}function gA(t,e,n,r){if(e===!0&&r===!0)throw new K(U.INVALID_ARGUMENT,`${t} and ${n} cannot be used together.`)}function yg(t){if(!Y.isDocumentKey(t))throw new K(U.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${t} has ${t.length}.`)}function vg(t){if(Y.isDocumentKey(t))throw new K(U.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${t} has ${t.length}.`)}function fE(t){return typeof t=="object"&&t!==null&&(Object.getPrototypeOf(t)===Object.prototype||Object.getPrototypeOf(t)===null)}function lf(t){if(t===void 0)return"undefined";if(t===null)return"null";if(typeof t=="string")return t.length>20&&(t=`${t.substring(0,20)}...`),JSON.stringify(t);if(typeof t=="number"||typeof t=="boolean")return""+t;if(typeof t=="object"){if(t instanceof Array)return"an array";{const e=function(r){return r.constructor?r.constructor.name:null}(t);return e?`a custom ${e} object`:"an object"}}return typeof t=="function"?"a function":ee(12329,{type:typeof t})}function mn(t,e){if("_delegate"in t&&(t=t._delegate),!(t instanceof e)){if(e.name===t.constructor.name)throw new K(U.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const n=lf(t);throw new K(U.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${n}`)}}return t}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Le(t,e){const n={typeString:t};return e&&(n.value=e),n}function Jo(t,e){if(!fE(t))throw new K(U.INVALID_ARGUMENT,"JSON must be an object");let n;for(const r in e)if(e[r]){const i=e[r].typeString,s="value"in e[r]?{value:e[r].value}:void 0;if(!(r in t)){n=`JSON missing required field: '${r}'`;break}const o=t[r];if(i&&typeof o!==i){n=`JSON field '${r}' must be a ${i}.`;break}if(s!==void 0&&o!==s.value){n=`Expected '${r}' field to equal '${s.value}'`;break}}if(n)throw new K(U.INVALID_ARGUMENT,n);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _g=-62135596800,Eg=1e6;class Te{static now(){return Te.fromMillis(Date.now())}static fromDate(e){return Te.fromMillis(e.getTime())}static fromMillis(e){const n=Math.floor(e/1e3),r=Math.floor((e-1e3*n)*Eg);return new Te(n,r)}constructor(e,n){if(this.seconds=e,this.nanoseconds=n,n<0)throw new K(U.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+n);if(n>=1e9)throw new K(U.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+n);if(e<_g)throw new K(U.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new K(U.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Eg}_compareTo(e){return this.seconds===e.seconds?ue(this.nanoseconds,e.nanoseconds):ue(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:Te._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Jo(e,Te._jsonSchema))return new Te(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-_g;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}Te._jsonSchemaVersion="firestore/timestamp/1.0",Te._jsonSchema={type:Le("string",Te._jsonSchemaVersion),seconds:Le("number"),nanoseconds:Le("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class te{static fromTimestamp(e){return new te(e)}static min(){return new te(new Te(0,0))}static max(){return new te(new Te(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oo=-1;function yA(t,e){const n=t.toTimestamp().seconds,r=t.toTimestamp().nanoseconds+1,i=te.fromTimestamp(r===1e9?new Te(n+1,0):new Te(n,r));return new Tr(i,Y.empty(),e)}function vA(t){return new Tr(t.readTime,t.key,Oo)}class Tr{constructor(e,n,r){this.readTime=e,this.documentKey=n,this.largestBatchId=r}static min(){return new Tr(te.min(),Y.empty(),Oo)}static max(){return new Tr(te.max(),Y.empty(),Oo)}}function _A(t,e){let n=t.readTime.compareTo(e.readTime);return n!==0?n:(n=Y.comparator(t.documentKey,e.documentKey),n!==0?n:ue(t.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const EA="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class wA{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function fs(t){if(t.code!==U.FAILED_PRECONDITION||t.message!==EA)throw t;H("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class F{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(n=>{this.isDone=!0,this.result=n,this.nextCallback&&this.nextCallback(n)},n=>{this.isDone=!0,this.error=n,this.catchCallback&&this.catchCallback(n)})}catch(e){return this.next(void 0,e)}next(e,n){return this.callbackAttached&&ee(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(n,this.error):this.wrapSuccess(e,this.result):new F((r,i)=>{this.nextCallback=s=>{this.wrapSuccess(e,s).next(r,i)},this.catchCallback=s=>{this.wrapFailure(n,s).next(r,i)}})}toPromise(){return new Promise((e,n)=>{this.next(e,n)})}wrapUserFunction(e){try{const n=e();return n instanceof F?n:F.resolve(n)}catch(n){return F.reject(n)}}wrapSuccess(e,n){return e?this.wrapUserFunction(()=>e(n)):F.resolve(n)}wrapFailure(e,n){return e?this.wrapUserFunction(()=>e(n)):F.reject(n)}static resolve(e){return new F((n,r)=>{n(e)})}static reject(e){return new F((n,r)=>{r(e)})}static waitFor(e){return new F((n,r)=>{let i=0,s=0,o=!1;e.forEach(l=>{++i,l.next(()=>{++s,o&&s===i&&n()},u=>r(u))}),o=!0,s===i&&n()})}static or(e){let n=F.resolve(!1);for(const r of e)n=n.next(i=>i?F.resolve(i):r());return n}static forEach(e,n){const r=[];return e.forEach((i,s)=>{r.push(n.call(this,i,s))}),this.waitFor(r)}static mapArray(e,n){return new F((r,i)=>{const s=e.length,o=new Array(s);let l=0;for(let u=0;u<s;u++){const h=u;n(e[h]).next(p=>{o[h]=p,++l,l===s&&r(o)},p=>i(p))}})}static doWhile(e,n){return new F((r,i)=>{const s=()=>{e()===!0?n().next(()=>{s()},i):r()};s()})}}function TA(t){const e=t.match(/Android ([\d.]+)/i),n=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(n)}function ps(t){return t.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wu{constructor(e,n){this.previousValue=e,n&&(n.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>n.writeSequenceNumber(r))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}wu.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uf=-1;function Tu(t){return t==null}function zl(t){return t===0&&1/t==-1/0}function IA(t){return typeof t=="number"&&Number.isInteger(t)&&!zl(t)&&t<=Number.MAX_SAFE_INTEGER&&t>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pE="";function SA(t){let e="";for(let n=0;n<t.length;n++)e.length>0&&(e=wg(e)),e=AA(t.get(n),e);return wg(e)}function AA(t,e){let n=e;const r=t.length;for(let i=0;i<r;i++){const s=t.charAt(i);switch(s){case"\0":n+="";break;case pE:n+="";break;default:n+=s}}return n}function wg(t){return t+pE+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tg(t){let e=0;for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e++;return e}function br(t,e){for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e(n,t[n])}function mE(t){for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pe{constructor(e,n){this.comparator=e,this.root=n||Qe.EMPTY}insert(e,n){return new Pe(this.comparator,this.root.insert(e,n,this.comparator).copy(null,null,Qe.BLACK,null,null))}remove(e){return new Pe(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Qe.BLACK,null,null))}get(e){let n=this.root;for(;!n.isEmpty();){const r=this.comparator(e,n.key);if(r===0)return n.value;r<0?n=n.left:r>0&&(n=n.right)}return null}indexOf(e){let n=0,r=this.root;for(;!r.isEmpty();){const i=this.comparator(e,r.key);if(i===0)return n+r.left.size;i<0?r=r.left:(n+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((n,r)=>(e(n,r),!1))}toString(){const e=[];return this.inorderTraversal((n,r)=>(e.push(`${n}:${r}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Ua(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Ua(this.root,e,this.comparator,!1)}getReverseIterator(){return new Ua(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Ua(this.root,e,this.comparator,!0)}}class Ua{constructor(e,n,r,i){this.isReverse=i,this.nodeStack=[];let s=1;for(;!e.isEmpty();)if(s=n?r(e.key,n):1,n&&i&&(s*=-1),s<0)e=this.isReverse?e.left:e.right;else{if(s===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const n={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return n}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class Qe{constructor(e,n,r,i,s){this.key=e,this.value=n,this.color=r??Qe.RED,this.left=i??Qe.EMPTY,this.right=s??Qe.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,n,r,i,s){return new Qe(e??this.key,n??this.value,r??this.color,i??this.left,s??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,n,r){let i=this;const s=r(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,n,r),null):s===0?i.copy(null,n,null,null,null):i.copy(null,null,null,null,i.right.insert(e,n,r)),i.fixUp()}removeMin(){if(this.left.isEmpty())return Qe.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,n){let r,i=this;if(n(e,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,n),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),n(e,i.key)===0){if(i.right.isEmpty())return Qe.EMPTY;r=i.right.min(),i=i.copy(r.key,r.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,n))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,Qe.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,Qe.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),n=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,n)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw ee(43730,{key:this.key,value:this.value});if(this.right.isRed())throw ee(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw ee(27949);return e+(this.isRed()?0:1)}}Qe.EMPTY=null,Qe.RED=!0,Qe.BLACK=!1;Qe.EMPTY=new class{constructor(){this.size=0}get key(){throw ee(57766)}get value(){throw ee(16141)}get color(){throw ee(16727)}get left(){throw ee(29726)}get right(){throw ee(36894)}copy(e,n,r,i,s){return this}insert(e,n,r){return new Qe(e,n)}remove(e,n){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class je{constructor(e){this.comparator=e,this.data=new Pe(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((n,r)=>(e(n),!1))}forEachInRange(e,n){const r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){const i=r.getNext();if(this.comparator(i.key,e[1])>=0)return;n(i.key)}}forEachWhile(e,n){let r;for(r=n!==void 0?this.data.getIteratorFrom(n):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){const n=this.data.getIteratorFrom(e);return n.hasNext()?n.getNext().key:null}getIterator(){return new Ig(this.data.getIterator())}getIteratorFrom(e){return new Ig(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let n=this;return n.size<e.size&&(n=e,e=this),e.forEach(r=>{n=n.add(r)}),n}isEqual(e){if(!(e instanceof je)||this.size!==e.size)return!1;const n=this.data.getIterator(),r=e.data.getIterator();for(;n.hasNext();){const i=n.getNext().key,s=r.getNext().key;if(this.comparator(i,s)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(n=>{e.push(n)}),e}toString(){const e=[];return this.forEach(n=>e.push(n)),"SortedSet("+e.toString()+")"}copy(e){const n=new je(this.comparator);return n.data=e,n}}class Ig{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt{constructor(e){this.fields=e,e.sort(Ye.comparator)}static empty(){return new Pt([])}unionWith(e){let n=new je(Ye.comparator);for(const r of this.fields)n=n.add(r);for(const r of e)n=n.add(r);return new Pt(n.toArray())}covers(e){for(const n of this.fields)if(n.isPrefixOf(e))return!0;return!1}isEqual(e){return ts(this.fields,e.fields,(n,r)=>n.isEqual(r))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gE extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ze{constructor(e){this.binaryString=e}static fromBase64String(e){const n=function(i){try{return atob(i)}catch(s){throw typeof DOMException<"u"&&s instanceof DOMException?new gE("Invalid base64 string: "+s):s}}(e);return new Ze(n)}static fromUint8Array(e){const n=function(i){let s="";for(let o=0;o<i.length;++o)s+=String.fromCharCode(i[o]);return s}(e);return new Ze(n)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(n){return btoa(n)}(this.binaryString)}toUint8Array(){return function(n){const r=new Uint8Array(n.length);for(let i=0;i<n.length;i++)r[i]=n.charCodeAt(i);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return ue(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Ze.EMPTY_BYTE_STRING=new Ze("");const CA=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Ir(t){if(fe(!!t,39018),typeof t=="string"){let e=0;const n=CA.exec(t);if(fe(!!n,46558,{timestamp:t}),n[1]){let i=n[1];i=(i+"000000000").substr(0,9),e=Number(i)}const r=new Date(t);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:be(t.seconds),nanos:be(t.nanos)}}function be(t){return typeof t=="number"?t:typeof t=="string"?Number(t):0}function Sr(t){return typeof t=="string"?Ze.fromBase64String(t):Ze.fromUint8Array(t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yE="server_timestamp",vE="__type__",_E="__previous_value__",EE="__local_write_time__";function cf(t){var n,r;return((r=(((n=t==null?void 0:t.mapValue)==null?void 0:n.fields)||{})[vE])==null?void 0:r.stringValue)===yE}function Iu(t){const e=t.mapValue.fields[_E];return cf(e)?Iu(e):e}function Lo(t){const e=Ir(t.mapValue.fields[EE].timestampValue);return new Te(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class RA{constructor(e,n,r,i,s,o,l,u,h,p,m){this.databaseId=e,this.appId=n,this.persistenceKey=r,this.host=i,this.ssl=s,this.forceLongPolling=o,this.autoDetectLongPolling=l,this.longPollingOptions=u,this.useFetchStreams=h,this.isUsingEmulator=p,this.apiKey=m}}const Bl="(default)";class Mo{constructor(e,n){this.projectId=e,this.database=n||Bl}static empty(){return new Mo("","")}get isDefaultDatabase(){return this.database===Bl}isEqual(e){return e instanceof Mo&&e.projectId===this.projectId&&e.database===this.database}}function kA(t,e){if(!Object.prototype.hasOwnProperty.apply(t.options,["projectId"]))throw new K(U.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Mo(t.options.projectId,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wE="__type__",PA="__max__",za={mapValue:{}},TE="__vector__",jl="value";function Ar(t){return"nullValue"in t?0:"booleanValue"in t?1:"integerValue"in t||"doubleValue"in t?2:"timestampValue"in t?3:"stringValue"in t?5:"bytesValue"in t?6:"referenceValue"in t?7:"geoPointValue"in t?8:"arrayValue"in t?9:"mapValue"in t?cf(t)?4:xA(t)?9007199254740991:NA(t)?10:11:ee(28295,{value:t})}function gn(t,e){if(t===e)return!0;const n=Ar(t);if(n!==Ar(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return t.booleanValue===e.booleanValue;case 4:return Lo(t).isEqual(Lo(e));case 3:return function(i,s){if(typeof i.timestampValue=="string"&&typeof s.timestampValue=="string"&&i.timestampValue.length===s.timestampValue.length)return i.timestampValue===s.timestampValue;const o=Ir(i.timestampValue),l=Ir(s.timestampValue);return o.seconds===l.seconds&&o.nanos===l.nanos}(t,e);case 5:return t.stringValue===e.stringValue;case 6:return function(i,s){return Sr(i.bytesValue).isEqual(Sr(s.bytesValue))}(t,e);case 7:return t.referenceValue===e.referenceValue;case 8:return function(i,s){return be(i.geoPointValue.latitude)===be(s.geoPointValue.latitude)&&be(i.geoPointValue.longitude)===be(s.geoPointValue.longitude)}(t,e);case 2:return function(i,s){if("integerValue"in i&&"integerValue"in s)return be(i.integerValue)===be(s.integerValue);if("doubleValue"in i&&"doubleValue"in s){const o=be(i.doubleValue),l=be(s.doubleValue);return o===l?zl(o)===zl(l):isNaN(o)&&isNaN(l)}return!1}(t,e);case 9:return ts(t.arrayValue.values||[],e.arrayValue.values||[],gn);case 10:case 11:return function(i,s){const o=i.mapValue.fields||{},l=s.mapValue.fields||{};if(Tg(o)!==Tg(l))return!1;for(const u in o)if(o.hasOwnProperty(u)&&(l[u]===void 0||!gn(o[u],l[u])))return!1;return!0}(t,e);default:return ee(52216,{left:t})}}function Fo(t,e){return(t.values||[]).find(n=>gn(n,e))!==void 0}function ns(t,e){if(t===e)return 0;const n=Ar(t),r=Ar(e);if(n!==r)return ue(n,r);switch(n){case 0:case 9007199254740991:return 0;case 1:return ue(t.booleanValue,e.booleanValue);case 2:return function(s,o){const l=be(s.integerValue||s.doubleValue),u=be(o.integerValue||o.doubleValue);return l<u?-1:l>u?1:l===u?0:isNaN(l)?isNaN(u)?0:-1:1}(t,e);case 3:return Sg(t.timestampValue,e.timestampValue);case 4:return Sg(Lo(t),Lo(e));case 5:return $h(t.stringValue,e.stringValue);case 6:return function(s,o){const l=Sr(s),u=Sr(o);return l.compareTo(u)}(t.bytesValue,e.bytesValue);case 7:return function(s,o){const l=s.split("/"),u=o.split("/");for(let h=0;h<l.length&&h<u.length;h++){const p=ue(l[h],u[h]);if(p!==0)return p}return ue(l.length,u.length)}(t.referenceValue,e.referenceValue);case 8:return function(s,o){const l=ue(be(s.latitude),be(o.latitude));return l!==0?l:ue(be(s.longitude),be(o.longitude))}(t.geoPointValue,e.geoPointValue);case 9:return Ag(t.arrayValue,e.arrayValue);case 10:return function(s,o){var g,_,N,R;const l=s.fields||{},u=o.fields||{},h=(g=l[jl])==null?void 0:g.arrayValue,p=(_=u[jl])==null?void 0:_.arrayValue,m=ue(((N=h==null?void 0:h.values)==null?void 0:N.length)||0,((R=p==null?void 0:p.values)==null?void 0:R.length)||0);return m!==0?m:Ag(h,p)}(t.mapValue,e.mapValue);case 11:return function(s,o){if(s===za.mapValue&&o===za.mapValue)return 0;if(s===za.mapValue)return 1;if(o===za.mapValue)return-1;const l=s.fields||{},u=Object.keys(l),h=o.fields||{},p=Object.keys(h);u.sort(),p.sort();for(let m=0;m<u.length&&m<p.length;++m){const g=$h(u[m],p[m]);if(g!==0)return g;const _=ns(l[u[m]],h[p[m]]);if(_!==0)return _}return ue(u.length,p.length)}(t.mapValue,e.mapValue);default:throw ee(23264,{he:n})}}function Sg(t,e){if(typeof t=="string"&&typeof e=="string"&&t.length===e.length)return ue(t,e);const n=Ir(t),r=Ir(e),i=ue(n.seconds,r.seconds);return i!==0?i:ue(n.nanos,r.nanos)}function Ag(t,e){const n=t.values||[],r=e.values||[];for(let i=0;i<n.length&&i<r.length;++i){const s=ns(n[i],r[i]);if(s)return s}return ue(n.length,r.length)}function rs(t){return Wh(t)}function Wh(t){return"nullValue"in t?"null":"booleanValue"in t?""+t.booleanValue:"integerValue"in t?""+t.integerValue:"doubleValue"in t?""+t.doubleValue:"timestampValue"in t?function(n){const r=Ir(n);return`time(${r.seconds},${r.nanos})`}(t.timestampValue):"stringValue"in t?t.stringValue:"bytesValue"in t?function(n){return Sr(n).toBase64()}(t.bytesValue):"referenceValue"in t?function(n){return Y.fromName(n).toString()}(t.referenceValue):"geoPointValue"in t?function(n){return`geo(${n.latitude},${n.longitude})`}(t.geoPointValue):"arrayValue"in t?function(n){let r="[",i=!0;for(const s of n.values||[])i?i=!1:r+=",",r+=Wh(s);return r+"]"}(t.arrayValue):"mapValue"in t?function(n){const r=Object.keys(n.fields||{}).sort();let i="{",s=!0;for(const o of r)s?s=!1:i+=",",i+=`${o}:${Wh(n.fields[o])}`;return i+"}"}(t.mapValue):ee(61005,{value:t})}function sl(t){switch(Ar(t)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Iu(t);return e?16+sl(e):16;case 5:return 2*t.stringValue.length;case 6:return Sr(t.bytesValue).approximateByteSize();case 7:return t.referenceValue.length;case 9:return function(r){return(r.values||[]).reduce((i,s)=>i+sl(s),0)}(t.arrayValue);case 10:case 11:return function(r){let i=0;return br(r.fields,(s,o)=>{i+=s.length+sl(o)}),i}(t.mapValue);default:throw ee(13486,{value:t})}}function Hh(t){return!!t&&"integerValue"in t}function hf(t){return!!t&&"arrayValue"in t}function Cg(t){return!!t&&"nullValue"in t}function Rg(t){return!!t&&"doubleValue"in t&&isNaN(Number(t.doubleValue))}function ol(t){return!!t&&"mapValue"in t}function NA(t){var n,r;return((r=(((n=t==null?void 0:t.mapValue)==null?void 0:n.fields)||{})[wE])==null?void 0:r.stringValue)===TE}function ho(t){if(t.geoPointValue)return{geoPointValue:{...t.geoPointValue}};if(t.timestampValue&&typeof t.timestampValue=="object")return{timestampValue:{...t.timestampValue}};if(t.mapValue){const e={mapValue:{fields:{}}};return br(t.mapValue.fields,(n,r)=>e.mapValue.fields[n]=ho(r)),e}if(t.arrayValue){const e={arrayValue:{values:[]}};for(let n=0;n<(t.arrayValue.values||[]).length;++n)e.arrayValue.values[n]=ho(t.arrayValue.values[n]);return e}return{...t}}function xA(t){return(((t.mapValue||{}).fields||{}).__type__||{}).stringValue===PA}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wt{constructor(e){this.value=e}static empty(){return new wt({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let n=this.value;for(let r=0;r<e.length-1;++r)if(n=(n.mapValue.fields||{})[e.get(r)],!ol(n))return null;return n=(n.mapValue.fields||{})[e.lastSegment()],n||null}}set(e,n){this.getFieldsMap(e.popLast())[e.lastSegment()]=ho(n)}setAll(e){let n=Ye.emptyPath(),r={},i=[];e.forEach((o,l)=>{if(!n.isImmediateParentOf(l)){const u=this.getFieldsMap(n);this.applyChanges(u,r,i),r={},i=[],n=l.popLast()}o?r[l.lastSegment()]=ho(o):i.push(l.lastSegment())});const s=this.getFieldsMap(n);this.applyChanges(s,r,i)}delete(e){const n=this.field(e.popLast());ol(n)&&n.mapValue.fields&&delete n.mapValue.fields[e.lastSegment()]}isEqual(e){return gn(this.value,e.value)}getFieldsMap(e){let n=this.value;n.mapValue.fields||(n.mapValue={fields:{}});for(let r=0;r<e.length;++r){let i=n.mapValue.fields[e.get(r)];ol(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},n.mapValue.fields[e.get(r)]=i),n=i}return n.mapValue.fields}applyChanges(e,n,r){br(n,(i,s)=>e[i]=s);for(const i of r)delete e[i]}clone(){return new wt(ho(this.value))}}function IE(t){const e=[];return br(t.fields,(n,r)=>{const i=new Ye([n]);if(ol(r)){const s=IE(r.mapValue).fields;if(s.length===0)e.push(i);else for(const o of s)e.push(i.child(o))}else e.push(i)}),new Pt(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lt{constructor(e,n,r,i,s,o,l){this.key=e,this.documentType=n,this.version=r,this.readTime=i,this.createTime=s,this.data=o,this.documentState=l}static newInvalidDocument(e){return new lt(e,0,te.min(),te.min(),te.min(),wt.empty(),0)}static newFoundDocument(e,n,r,i){return new lt(e,1,n,te.min(),r,i,0)}static newNoDocument(e,n){return new lt(e,2,n,te.min(),te.min(),wt.empty(),0)}static newUnknownDocument(e,n){return new lt(e,3,n,te.min(),te.min(),wt.empty(),2)}convertToFoundDocument(e,n){return!this.createTime.isEqual(te.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=n,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=wt.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=wt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=te.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof lt&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new lt(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $l{constructor(e,n){this.position=e,this.inclusive=n}}function kg(t,e,n){let r=0;for(let i=0;i<t.position.length;i++){const s=e[i],o=t.position[i];if(s.field.isKeyField()?r=Y.comparator(Y.fromName(o.referenceValue),n.key):r=ns(o,n.data.field(s.field)),s.dir==="desc"&&(r*=-1),r!==0)break}return r}function Pg(t,e){if(t===null)return e===null;if(e===null||t.inclusive!==e.inclusive||t.position.length!==e.position.length)return!1;for(let n=0;n<t.position.length;n++)if(!gn(t.position[n],e.position[n]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wl{constructor(e,n="asc"){this.field=e,this.dir=n}}function bA(t,e){return t.dir===e.dir&&t.field.isEqual(e.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class SE{}class ze extends SE{constructor(e,n,r){super(),this.field=e,this.op=n,this.value=r}static create(e,n,r){return e.isKeyField()?n==="in"||n==="not-in"?this.createKeyFieldInFilter(e,n,r):new VA(e,n,r):n==="array-contains"?new MA(e,r):n==="in"?new FA(e,r):n==="not-in"?new UA(e,r):n==="array-contains-any"?new zA(e,r):new ze(e,n,r)}static createKeyFieldInFilter(e,n,r){return n==="in"?new OA(e,r):new LA(e,r)}matches(e){const n=e.data.field(this.field);return this.op==="!="?n!==null&&n.nullValue===void 0&&this.matchesComparison(ns(n,this.value)):n!==null&&Ar(this.value)===Ar(n)&&this.matchesComparison(ns(n,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return ee(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class yn extends SE{constructor(e,n){super(),this.filters=e,this.op=n,this.Pe=null}static create(e,n){return new yn(e,n)}matches(e){return AE(this)?this.filters.find(n=>!n.matches(e))===void 0:this.filters.find(n=>n.matches(e))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((e,n)=>e.concat(n.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function AE(t){return t.op==="and"}function CE(t){return DA(t)&&AE(t)}function DA(t){for(const e of t.filters)if(e instanceof yn)return!1;return!0}function qh(t){if(t instanceof ze)return t.field.canonicalString()+t.op.toString()+rs(t.value);if(CE(t))return t.filters.map(e=>qh(e)).join(",");{const e=t.filters.map(n=>qh(n)).join(",");return`${t.op}(${e})`}}function RE(t,e){return t instanceof ze?function(r,i){return i instanceof ze&&r.op===i.op&&r.field.isEqual(i.field)&&gn(r.value,i.value)}(t,e):t instanceof yn?function(r,i){return i instanceof yn&&r.op===i.op&&r.filters.length===i.filters.length?r.filters.reduce((s,o,l)=>s&&RE(o,i.filters[l]),!0):!1}(t,e):void ee(19439)}function kE(t){return t instanceof ze?function(n){return`${n.field.canonicalString()} ${n.op} ${rs(n.value)}`}(t):t instanceof yn?function(n){return n.op.toString()+" {"+n.getFilters().map(kE).join(" ,")+"}"}(t):"Filter"}class VA extends ze{constructor(e,n,r){super(e,n,r),this.key=Y.fromName(r.referenceValue)}matches(e){const n=Y.comparator(e.key,this.key);return this.matchesComparison(n)}}class OA extends ze{constructor(e,n){super(e,"in",n),this.keys=PE("in",n)}matches(e){return this.keys.some(n=>n.isEqual(e.key))}}class LA extends ze{constructor(e,n){super(e,"not-in",n),this.keys=PE("not-in",n)}matches(e){return!this.keys.some(n=>n.isEqual(e.key))}}function PE(t,e){var n;return(((n=e.arrayValue)==null?void 0:n.values)||[]).map(r=>Y.fromName(r.referenceValue))}class MA extends ze{constructor(e,n){super(e,"array-contains",n)}matches(e){const n=e.data.field(this.field);return hf(n)&&Fo(n.arrayValue,this.value)}}class FA extends ze{constructor(e,n){super(e,"in",n)}matches(e){const n=e.data.field(this.field);return n!==null&&Fo(this.value.arrayValue,n)}}class UA extends ze{constructor(e,n){super(e,"not-in",n)}matches(e){if(Fo(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const n=e.data.field(this.field);return n!==null&&n.nullValue===void 0&&!Fo(this.value.arrayValue,n)}}class zA extends ze{constructor(e,n){super(e,"array-contains-any",n)}matches(e){const n=e.data.field(this.field);return!(!hf(n)||!n.arrayValue.values)&&n.arrayValue.values.some(r=>Fo(this.value.arrayValue,r))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class BA{constructor(e,n=null,r=[],i=[],s=null,o=null,l=null){this.path=e,this.collectionGroup=n,this.orderBy=r,this.filters=i,this.limit=s,this.startAt=o,this.endAt=l,this.Te=null}}function Ng(t,e=null,n=[],r=[],i=null,s=null,o=null){return new BA(t,e,n,r,i,s,o)}function df(t){const e=ne(t);if(e.Te===null){let n=e.path.canonicalString();e.collectionGroup!==null&&(n+="|cg:"+e.collectionGroup),n+="|f:",n+=e.filters.map(r=>qh(r)).join(","),n+="|ob:",n+=e.orderBy.map(r=>function(s){return s.field.canonicalString()+s.dir}(r)).join(","),Tu(e.limit)||(n+="|l:",n+=e.limit),e.startAt&&(n+="|lb:",n+=e.startAt.inclusive?"b:":"a:",n+=e.startAt.position.map(r=>rs(r)).join(",")),e.endAt&&(n+="|ub:",n+=e.endAt.inclusive?"a:":"b:",n+=e.endAt.position.map(r=>rs(r)).join(",")),e.Te=n}return e.Te}function ff(t,e){if(t.limit!==e.limit||t.orderBy.length!==e.orderBy.length)return!1;for(let n=0;n<t.orderBy.length;n++)if(!bA(t.orderBy[n],e.orderBy[n]))return!1;if(t.filters.length!==e.filters.length)return!1;for(let n=0;n<t.filters.length;n++)if(!RE(t.filters[n],e.filters[n]))return!1;return t.collectionGroup===e.collectionGroup&&!!t.path.isEqual(e.path)&&!!Pg(t.startAt,e.startAt)&&Pg(t.endAt,e.endAt)}function Gh(t){return Y.isDocumentKey(t.path)&&t.collectionGroup===null&&t.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Su{constructor(e,n=null,r=[],i=[],s=null,o="F",l=null,u=null){this.path=e,this.collectionGroup=n,this.explicitOrderBy=r,this.filters=i,this.limit=s,this.limitType=o,this.startAt=l,this.endAt=u,this.Ee=null,this.Ie=null,this.Re=null,this.startAt,this.endAt}}function jA(t,e,n,r,i,s,o,l){return new Su(t,e,n,r,i,s,o,l)}function pf(t){return new Su(t)}function xg(t){return t.filters.length===0&&t.limit===null&&t.startAt==null&&t.endAt==null&&(t.explicitOrderBy.length===0||t.explicitOrderBy.length===1&&t.explicitOrderBy[0].field.isKeyField())}function $A(t){return Y.isDocumentKey(t.path)&&t.collectionGroup===null&&t.filters.length===0}function WA(t){return t.collectionGroup!==null}function fo(t){const e=ne(t);if(e.Ee===null){e.Ee=[];const n=new Set;for(const s of e.explicitOrderBy)e.Ee.push(s),n.add(s.field.canonicalString());const r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let l=new je(Ye.comparator);return o.filters.forEach(u=>{u.getFlattenedFilters().forEach(h=>{h.isInequality()&&(l=l.add(h.field))})}),l})(e).forEach(s=>{n.has(s.canonicalString())||s.isKeyField()||e.Ee.push(new Wl(s,r))}),n.has(Ye.keyField().canonicalString())||e.Ee.push(new Wl(Ye.keyField(),r))}return e.Ee}function cn(t){const e=ne(t);return e.Ie||(e.Ie=HA(e,fo(t))),e.Ie}function HA(t,e){if(t.limitType==="F")return Ng(t.path,t.collectionGroup,e,t.filters,t.limit,t.startAt,t.endAt);{e=e.map(i=>{const s=i.dir==="desc"?"asc":"desc";return new Wl(i.field,s)});const n=t.endAt?new $l(t.endAt.position,t.endAt.inclusive):null,r=t.startAt?new $l(t.startAt.position,t.startAt.inclusive):null;return Ng(t.path,t.collectionGroup,e,t.filters,t.limit,n,r)}}function Kh(t,e,n){return new Su(t.path,t.collectionGroup,t.explicitOrderBy.slice(),t.filters.slice(),e,n,t.startAt,t.endAt)}function Au(t,e){return ff(cn(t),cn(e))&&t.limitType===e.limitType}function NE(t){return`${df(cn(t))}|lt:${t.limitType}`}function vi(t){return`Query(target=${function(n){let r=n.path.canonicalString();return n.collectionGroup!==null&&(r+=" collectionGroup="+n.collectionGroup),n.filters.length>0&&(r+=`, filters: [${n.filters.map(i=>kE(i)).join(", ")}]`),Tu(n.limit)||(r+=", limit: "+n.limit),n.orderBy.length>0&&(r+=`, orderBy: [${n.orderBy.map(i=>function(o){return`${o.field.canonicalString()} (${o.dir})`}(i)).join(", ")}]`),n.startAt&&(r+=", startAt: ",r+=n.startAt.inclusive?"b:":"a:",r+=n.startAt.position.map(i=>rs(i)).join(",")),n.endAt&&(r+=", endAt: ",r+=n.endAt.inclusive?"a:":"b:",r+=n.endAt.position.map(i=>rs(i)).join(",")),`Target(${r})`}(cn(t))}; limitType=${t.limitType})`}function Cu(t,e){return e.isFoundDocument()&&function(r,i){const s=i.key.path;return r.collectionGroup!==null?i.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(s):Y.isDocumentKey(r.path)?r.path.isEqual(s):r.path.isImmediateParentOf(s)}(t,e)&&function(r,i){for(const s of fo(r))if(!s.field.isKeyField()&&i.data.field(s.field)===null)return!1;return!0}(t,e)&&function(r,i){for(const s of r.filters)if(!s.matches(i))return!1;return!0}(t,e)&&function(r,i){return!(r.startAt&&!function(o,l,u){const h=kg(o,l,u);return o.inclusive?h<=0:h<0}(r.startAt,fo(r),i)||r.endAt&&!function(o,l,u){const h=kg(o,l,u);return o.inclusive?h>=0:h>0}(r.endAt,fo(r),i))}(t,e)}function qA(t){return t.collectionGroup||(t.path.length%2==1?t.path.lastSegment():t.path.get(t.path.length-2))}function xE(t){return(e,n)=>{let r=!1;for(const i of fo(t)){const s=GA(i,e,n);if(s!==0)return s;r=r||i.field.isKeyField()}return 0}}function GA(t,e,n){const r=t.field.isKeyField()?Y.comparator(e.key,n.key):function(s,o,l){const u=o.data.field(s),h=l.data.field(s);return u!==null&&h!==null?ns(u,h):ee(42886)}(t.field,e,n);switch(t.dir){case"asc":return r;case"desc":return-1*r;default:return ee(19790,{direction:t.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ci{constructor(e,n){this.mapKeyFn=e,this.equalsFn=n,this.inner={},this.innerSize=0}get(e){const n=this.mapKeyFn(e),r=this.inner[n];if(r!==void 0){for(const[i,s]of r)if(this.equalsFn(i,e))return s}}has(e){return this.get(e)!==void 0}set(e,n){const r=this.mapKeyFn(e),i=this.inner[r];if(i===void 0)return this.inner[r]=[[e,n]],void this.innerSize++;for(let s=0;s<i.length;s++)if(this.equalsFn(i[s][0],e))return void(i[s]=[e,n]);i.push([e,n]),this.innerSize++}delete(e){const n=this.mapKeyFn(e),r=this.inner[n];if(r===void 0)return!1;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],e))return r.length===1?delete this.inner[n]:r.splice(i,1),this.innerSize--,!0;return!1}forEach(e){br(this.inner,(n,r)=>{for(const[i,s]of r)e(i,s)})}isEmpty(){return mE(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const KA=new Pe(Y.comparator);function On(){return KA}const bE=new Pe(Y.comparator);function Zs(...t){let e=bE;for(const n of t)e=e.insert(n.key,n);return e}function DE(t){let e=bE;return t.forEach((n,r)=>e=e.insert(n,r.overlayedDocument)),e}function qr(){return po()}function VE(){return po()}function po(){return new ci(t=>t.toString(),(t,e)=>t.isEqual(e))}const QA=new Pe(Y.comparator),YA=new je(Y.comparator);function ce(...t){let e=YA;for(const n of t)e=e.add(n);return e}const XA=new je(ue);function JA(){return XA}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mf(t,e){if(t.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:zl(e)?"-0":e}}function OE(t){return{integerValue:""+t}}function ZA(t,e){return IA(e)?OE(e):mf(t,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ru{constructor(){this._=void 0}}function eC(t,e,n){return t instanceof Hl?function(i,s){const o={fields:{[vE]:{stringValue:yE},[EE]:{timestampValue:{seconds:i.seconds,nanos:i.nanoseconds}}}};return s&&cf(s)&&(s=Iu(s)),s&&(o.fields[_E]=s),{mapValue:o}}(n,e):t instanceof Uo?ME(t,e):t instanceof zo?FE(t,e):function(i,s){const o=LE(i,s),l=bg(o)+bg(i.Ae);return Hh(o)&&Hh(i.Ae)?OE(l):mf(i.serializer,l)}(t,e)}function tC(t,e,n){return t instanceof Uo?ME(t,e):t instanceof zo?FE(t,e):n}function LE(t,e){return t instanceof ql?function(r){return Hh(r)||function(s){return!!s&&"doubleValue"in s}(r)}(e)?e:{integerValue:0}:null}class Hl extends Ru{}class Uo extends Ru{constructor(e){super(),this.elements=e}}function ME(t,e){const n=UE(e);for(const r of t.elements)n.some(i=>gn(i,r))||n.push(r);return{arrayValue:{values:n}}}class zo extends Ru{constructor(e){super(),this.elements=e}}function FE(t,e){let n=UE(e);for(const r of t.elements)n=n.filter(i=>!gn(i,r));return{arrayValue:{values:n}}}class ql extends Ru{constructor(e,n){super(),this.serializer=e,this.Ae=n}}function bg(t){return be(t.integerValue||t.doubleValue)}function UE(t){return hf(t)&&t.arrayValue.values?t.arrayValue.values.slice():[]}function nC(t,e){return t.field.isEqual(e.field)&&function(r,i){return r instanceof Uo&&i instanceof Uo||r instanceof zo&&i instanceof zo?ts(r.elements,i.elements,gn):r instanceof ql&&i instanceof ql?gn(r.Ae,i.Ae):r instanceof Hl&&i instanceof Hl}(t.transform,e.transform)}class rC{constructor(e,n){this.version=e,this.transformResults=n}}class Xt{constructor(e,n){this.updateTime=e,this.exists=n}static none(){return new Xt}static exists(e){return new Xt(void 0,e)}static updateTime(e){return new Xt(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function al(t,e){return t.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(t.updateTime):t.exists===void 0||t.exists===e.isFoundDocument()}class ku{}function zE(t,e){if(!t.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return t.isNoDocument()?new gf(t.key,Xt.none()):new Zo(t.key,t.data,Xt.none());{const n=t.data,r=wt.empty();let i=new je(Ye.comparator);for(let s of e.fields)if(!i.has(s)){let o=n.field(s);o===null&&s.length>1&&(s=s.popLast(),o=n.field(s)),o===null?r.delete(s):r.set(s,o),i=i.add(s)}return new Dr(t.key,r,new Pt(i.toArray()),Xt.none())}}function iC(t,e,n){t instanceof Zo?function(i,s,o){const l=i.value.clone(),u=Vg(i.fieldTransforms,s,o.transformResults);l.setAll(u),s.convertToFoundDocument(o.version,l).setHasCommittedMutations()}(t,e,n):t instanceof Dr?function(i,s,o){if(!al(i.precondition,s))return void s.convertToUnknownDocument(o.version);const l=Vg(i.fieldTransforms,s,o.transformResults),u=s.data;u.setAll(BE(i)),u.setAll(l),s.convertToFoundDocument(o.version,u).setHasCommittedMutations()}(t,e,n):function(i,s,o){s.convertToNoDocument(o.version).setHasCommittedMutations()}(0,e,n)}function mo(t,e,n,r){return t instanceof Zo?function(s,o,l,u){if(!al(s.precondition,o))return l;const h=s.value.clone(),p=Og(s.fieldTransforms,u,o);return h.setAll(p),o.convertToFoundDocument(o.version,h).setHasLocalMutations(),null}(t,e,n,r):t instanceof Dr?function(s,o,l,u){if(!al(s.precondition,o))return l;const h=Og(s.fieldTransforms,u,o),p=o.data;return p.setAll(BE(s)),p.setAll(h),o.convertToFoundDocument(o.version,p).setHasLocalMutations(),l===null?null:l.unionWith(s.fieldMask.fields).unionWith(s.fieldTransforms.map(m=>m.field))}(t,e,n,r):function(s,o,l){return al(s.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):l}(t,e,n)}function sC(t,e){let n=null;for(const r of t.fieldTransforms){const i=e.data.field(r.field),s=LE(r.transform,i||null);s!=null&&(n===null&&(n=wt.empty()),n.set(r.field,s))}return n||null}function Dg(t,e){return t.type===e.type&&!!t.key.isEqual(e.key)&&!!t.precondition.isEqual(e.precondition)&&!!function(r,i){return r===void 0&&i===void 0||!(!r||!i)&&ts(r,i,(s,o)=>nC(s,o))}(t.fieldTransforms,e.fieldTransforms)&&(t.type===0?t.value.isEqual(e.value):t.type!==1||t.data.isEqual(e.data)&&t.fieldMask.isEqual(e.fieldMask))}class Zo extends ku{constructor(e,n,r,i=[]){super(),this.key=e,this.value=n,this.precondition=r,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class Dr extends ku{constructor(e,n,r,i,s=[]){super(),this.key=e,this.data=n,this.fieldMask=r,this.precondition=i,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}}function BE(t){const e=new Map;return t.fieldMask.fields.forEach(n=>{if(!n.isEmpty()){const r=t.data.field(n);e.set(n,r)}}),e}function Vg(t,e,n){const r=new Map;fe(t.length===n.length,32656,{Ve:n.length,de:t.length});for(let i=0;i<n.length;i++){const s=t[i],o=s.transform,l=e.data.field(s.field);r.set(s.field,tC(o,l,n[i]))}return r}function Og(t,e,n){const r=new Map;for(const i of t){const s=i.transform,o=n.data.field(i.field);r.set(i.field,eC(s,o,e))}return r}class gf extends ku{constructor(e,n){super(),this.key=e,this.precondition=n,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class oC extends ku{constructor(e,n){super(),this.key=e,this.precondition=n,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class aC{constructor(e,n,r,i){this.batchId=e,this.localWriteTime=n,this.baseMutations=r,this.mutations=i}applyToRemoteDocument(e,n){const r=n.mutationResults;for(let i=0;i<this.mutations.length;i++){const s=this.mutations[i];s.key.isEqual(e.key)&&iC(s,e,r[i])}}applyToLocalView(e,n){for(const r of this.baseMutations)r.key.isEqual(e.key)&&(n=mo(r,e,n,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(e.key)&&(n=mo(r,e,n,this.localWriteTime));return n}applyToLocalDocumentSet(e,n){const r=VE();return this.mutations.forEach(i=>{const s=e.get(i.key),o=s.overlayedDocument;let l=this.applyToLocalView(o,s.mutatedFields);l=n.has(i.key)?null:l;const u=zE(o,l);u!==null&&r.set(i.key,u),o.isValidDocument()||o.convertToNoDocument(te.min())}),r}keys(){return this.mutations.reduce((e,n)=>e.add(n.key),ce())}isEqual(e){return this.batchId===e.batchId&&ts(this.mutations,e.mutations,(n,r)=>Dg(n,r))&&ts(this.baseMutations,e.baseMutations,(n,r)=>Dg(n,r))}}class yf{constructor(e,n,r,i){this.batch=e,this.commitVersion=n,this.mutationResults=r,this.docVersions=i}static from(e,n,r){fe(e.mutations.length===r.length,58842,{me:e.mutations.length,fe:r.length});let i=function(){return QA}();const s=e.mutations;for(let o=0;o<s.length;o++)i=i.insert(s[o].key,r[o].version);return new yf(e,n,r,i)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lC{constructor(e,n){this.largestBatchId=e,this.mutation=n}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uC{constructor(e,n){this.count=e,this.unchangedNames=n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ve,he;function cC(t){switch(t){case U.OK:return ee(64938);case U.CANCELLED:case U.UNKNOWN:case U.DEADLINE_EXCEEDED:case U.RESOURCE_EXHAUSTED:case U.INTERNAL:case U.UNAVAILABLE:case U.UNAUTHENTICATED:return!1;case U.INVALID_ARGUMENT:case U.NOT_FOUND:case U.ALREADY_EXISTS:case U.PERMISSION_DENIED:case U.FAILED_PRECONDITION:case U.ABORTED:case U.OUT_OF_RANGE:case U.UNIMPLEMENTED:case U.DATA_LOSS:return!0;default:return ee(15467,{code:t})}}function jE(t){if(t===void 0)return Vn("GRPC error has no .code"),U.UNKNOWN;switch(t){case Ve.OK:return U.OK;case Ve.CANCELLED:return U.CANCELLED;case Ve.UNKNOWN:return U.UNKNOWN;case Ve.DEADLINE_EXCEEDED:return U.DEADLINE_EXCEEDED;case Ve.RESOURCE_EXHAUSTED:return U.RESOURCE_EXHAUSTED;case Ve.INTERNAL:return U.INTERNAL;case Ve.UNAVAILABLE:return U.UNAVAILABLE;case Ve.UNAUTHENTICATED:return U.UNAUTHENTICATED;case Ve.INVALID_ARGUMENT:return U.INVALID_ARGUMENT;case Ve.NOT_FOUND:return U.NOT_FOUND;case Ve.ALREADY_EXISTS:return U.ALREADY_EXISTS;case Ve.PERMISSION_DENIED:return U.PERMISSION_DENIED;case Ve.FAILED_PRECONDITION:return U.FAILED_PRECONDITION;case Ve.ABORTED:return U.ABORTED;case Ve.OUT_OF_RANGE:return U.OUT_OF_RANGE;case Ve.UNIMPLEMENTED:return U.UNIMPLEMENTED;case Ve.DATA_LOSS:return U.DATA_LOSS;default:return ee(39323,{code:t})}}(he=Ve||(Ve={}))[he.OK=0]="OK",he[he.CANCELLED=1]="CANCELLED",he[he.UNKNOWN=2]="UNKNOWN",he[he.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",he[he.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",he[he.NOT_FOUND=5]="NOT_FOUND",he[he.ALREADY_EXISTS=6]="ALREADY_EXISTS",he[he.PERMISSION_DENIED=7]="PERMISSION_DENIED",he[he.UNAUTHENTICATED=16]="UNAUTHENTICATED",he[he.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",he[he.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",he[he.ABORTED=10]="ABORTED",he[he.OUT_OF_RANGE=11]="OUT_OF_RANGE",he[he.UNIMPLEMENTED=12]="UNIMPLEMENTED",he[he.INTERNAL=13]="INTERNAL",he[he.UNAVAILABLE=14]="UNAVAILABLE",he[he.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hC(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dC=new yr([4294967295,4294967295],0);function Lg(t){const e=hC().encode(t),n=new iE;return n.update(e),new Uint8Array(n.digest())}function Mg(t){const e=new DataView(t.buffer),n=e.getUint32(0,!0),r=e.getUint32(4,!0),i=e.getUint32(8,!0),s=e.getUint32(12,!0);return[new yr([n,r],0),new yr([i,s],0)]}class vf{constructor(e,n,r){if(this.bitmap=e,this.padding=n,this.hashCount=r,n<0||n>=8)throw new eo(`Invalid padding: ${n}`);if(r<0)throw new eo(`Invalid hash count: ${r}`);if(e.length>0&&this.hashCount===0)throw new eo(`Invalid hash count: ${r}`);if(e.length===0&&n!==0)throw new eo(`Invalid padding when bitmap length is 0: ${n}`);this.ge=8*e.length-n,this.pe=yr.fromNumber(this.ge)}ye(e,n,r){let i=e.add(n.multiply(yr.fromNumber(r)));return i.compare(dC)===1&&(i=new yr([i.getBits(0),i.getBits(1)],0)),i.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const n=Lg(e),[r,i]=Mg(n);for(let s=0;s<this.hashCount;s++){const o=this.ye(r,i,s);if(!this.we(o))return!1}return!0}static create(e,n,r){const i=e%8==0?0:8-e%8,s=new Uint8Array(Math.ceil(e/8)),o=new vf(s,i,n);return r.forEach(l=>o.insert(l)),o}insert(e){if(this.ge===0)return;const n=Lg(e),[r,i]=Mg(n);for(let s=0;s<this.hashCount;s++){const o=this.ye(r,i,s);this.Se(o)}}Se(e){const n=Math.floor(e/8),r=e%8;this.bitmap[n]|=1<<r}}class eo extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pu{constructor(e,n,r,i,s){this.snapshotVersion=e,this.targetChanges=n,this.targetMismatches=r,this.documentUpdates=i,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(e,n,r){const i=new Map;return i.set(e,ea.createSynthesizedTargetChangeForCurrentChange(e,n,r)),new Pu(te.min(),i,new Pe(ue),On(),ce())}}class ea{constructor(e,n,r,i,s){this.resumeToken=e,this.current=n,this.addedDocuments=r,this.modifiedDocuments=i,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(e,n,r){return new ea(r,n,ce(),ce(),ce())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ll{constructor(e,n,r,i){this.be=e,this.removedTargetIds=n,this.key=r,this.De=i}}class $E{constructor(e,n){this.targetId=e,this.Ce=n}}class WE{constructor(e,n,r=Ze.EMPTY_BYTE_STRING,i=null){this.state=e,this.targetIds=n,this.resumeToken=r,this.cause=i}}class Fg{constructor(){this.ve=0,this.Fe=Ug(),this.Me=Ze.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=ce(),n=ce(),r=ce();return this.Fe.forEach((i,s)=>{switch(s){case 0:e=e.add(i);break;case 2:n=n.add(i);break;case 1:r=r.add(i);break;default:ee(38017,{changeType:s})}}),new ea(this.Me,this.xe,e,n,r)}qe(){this.Oe=!1,this.Fe=Ug()}Ke(e,n){this.Oe=!0,this.Fe=this.Fe.insert(e,n)}Ue(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}$e(){this.ve+=1}We(){this.ve-=1,fe(this.ve>=0,3241,{ve:this.ve})}Qe(){this.Oe=!0,this.xe=!0}}class fC{constructor(e){this.Ge=e,this.ze=new Map,this.je=On(),this.Je=Ba(),this.He=Ba(),this.Ze=new Pe(ue)}Xe(e){for(const n of e.be)e.De&&e.De.isFoundDocument()?this.Ye(n,e.De):this.et(n,e.key,e.De);for(const n of e.removedTargetIds)this.et(n,e.key,e.De)}tt(e){this.forEachTarget(e,n=>{const r=this.nt(n);switch(e.state){case 0:this.rt(n)&&r.Le(e.resumeToken);break;case 1:r.We(),r.Ne||r.qe(),r.Le(e.resumeToken);break;case 2:r.We(),r.Ne||this.removeTarget(n);break;case 3:this.rt(n)&&(r.Qe(),r.Le(e.resumeToken));break;case 4:this.rt(n)&&(this.it(n),r.Le(e.resumeToken));break;default:ee(56790,{state:e.state})}})}forEachTarget(e,n){e.targetIds.length>0?e.targetIds.forEach(n):this.ze.forEach((r,i)=>{this.rt(i)&&n(i)})}st(e){const n=e.targetId,r=e.Ce.count,i=this.ot(n);if(i){const s=i.target;if(Gh(s))if(r===0){const o=new Y(s.path);this.et(n,o,lt.newNoDocument(o,te.min()))}else fe(r===1,20013,{expectedCount:r});else{const o=this._t(n);if(o!==r){const l=this.ut(e),u=l?this.ct(l,e,o):1;if(u!==0){this.it(n);const h=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ze=this.Ze.insert(n,h)}}}}}ut(e){const n=e.Ce.unchangedNames;if(!n||!n.bits)return null;const{bits:{bitmap:r="",padding:i=0},hashCount:s=0}=n;let o,l;try{o=Sr(r).toUint8Array()}catch(u){if(u instanceof gE)return ii("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{l=new vf(o,i,s)}catch(u){return ii(u instanceof eo?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return l.ge===0?null:l}ct(e,n,r){return n.Ce.count===r-this.Pt(e,n.targetId)?0:2}Pt(e,n){const r=this.Ge.getRemoteKeysForTarget(n);let i=0;return r.forEach(s=>{const o=this.Ge.ht(),l=`projects/${o.projectId}/databases/${o.database}/documents/${s.path.canonicalString()}`;e.mightContain(l)||(this.et(n,s,null),i++)}),i}Tt(e){const n=new Map;this.ze.forEach((s,o)=>{const l=this.ot(o);if(l){if(s.current&&Gh(l.target)){const u=new Y(l.target.path);this.Et(u).has(o)||this.It(o,u)||this.et(o,u,lt.newNoDocument(u,e))}s.Be&&(n.set(o,s.ke()),s.qe())}});let r=ce();this.He.forEach((s,o)=>{let l=!0;o.forEachWhile(u=>{const h=this.ot(u);return!h||h.purpose==="TargetPurposeLimboResolution"||(l=!1,!1)}),l&&(r=r.add(s))}),this.je.forEach((s,o)=>o.setReadTime(e));const i=new Pu(e,n,this.Ze,this.je,r);return this.je=On(),this.Je=Ba(),this.He=Ba(),this.Ze=new Pe(ue),i}Ye(e,n){if(!this.rt(e))return;const r=this.It(e,n.key)?2:0;this.nt(e).Ke(n.key,r),this.je=this.je.insert(n.key,n),this.Je=this.Je.insert(n.key,this.Et(n.key).add(e)),this.He=this.He.insert(n.key,this.Rt(n.key).add(e))}et(e,n,r){if(!this.rt(e))return;const i=this.nt(e);this.It(e,n)?i.Ke(n,1):i.Ue(n),this.He=this.He.insert(n,this.Rt(n).delete(e)),this.He=this.He.insert(n,this.Rt(n).add(e)),r&&(this.je=this.je.insert(n,r))}removeTarget(e){this.ze.delete(e)}_t(e){const n=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}$e(e){this.nt(e).$e()}nt(e){let n=this.ze.get(e);return n||(n=new Fg,this.ze.set(e,n)),n}Rt(e){let n=this.He.get(e);return n||(n=new je(ue),this.He=this.He.insert(e,n)),n}Et(e){let n=this.Je.get(e);return n||(n=new je(ue),this.Je=this.Je.insert(e,n)),n}rt(e){const n=this.ot(e)!==null;return n||H("WatchChangeAggregator","Detected inactive target",e),n}ot(e){const n=this.ze.get(e);return n&&n.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new Fg),this.Ge.getRemoteKeysForTarget(e).forEach(n=>{this.et(e,n,null)})}It(e,n){return this.Ge.getRemoteKeysForTarget(e).has(n)}}function Ba(){return new Pe(Y.comparator)}function Ug(){return new Pe(Y.comparator)}const pC={asc:"ASCENDING",desc:"DESCENDING"},mC={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},gC={and:"AND",or:"OR"};class yC{constructor(e,n){this.databaseId=e,this.useProto3Json=n}}function Qh(t,e){return t.useProto3Json||Tu(e)?e:{value:e}}function Gl(t,e){return t.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function HE(t,e){return t.useProto3Json?e.toBase64():e.toUint8Array()}function vC(t,e){return Gl(t,e.toTimestamp())}function hn(t){return fe(!!t,49232),te.fromTimestamp(function(n){const r=Ir(n);return new Te(r.seconds,r.nanos)}(t))}function _f(t,e){return Yh(t,e).canonicalString()}function Yh(t,e){const n=function(i){return new we(["projects",i.projectId,"databases",i.database])}(t).child("documents");return e===void 0?n:n.child(e)}function qE(t){const e=we.fromString(t);return fe(XE(e),10190,{key:e.toString()}),e}function Xh(t,e){return _f(t.databaseId,e.path)}function Uc(t,e){const n=qE(e);if(n.get(1)!==t.databaseId.projectId)throw new K(U.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+n.get(1)+" vs "+t.databaseId.projectId);if(n.get(3)!==t.databaseId.database)throw new K(U.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+n.get(3)+" vs "+t.databaseId.database);return new Y(KE(n))}function GE(t,e){return _f(t.databaseId,e)}function _C(t){const e=qE(t);return e.length===4?we.emptyPath():KE(e)}function Jh(t){return new we(["projects",t.databaseId.projectId,"databases",t.databaseId.database]).canonicalString()}function KE(t){return fe(t.length>4&&t.get(4)==="documents",29091,{key:t.toString()}),t.popFirst(5)}function zg(t,e,n){return{name:Xh(t,e),fields:n.value.mapValue.fields}}function EC(t,e){let n;if("targetChange"in e){e.targetChange;const r=function(h){return h==="NO_CHANGE"?0:h==="ADD"?1:h==="REMOVE"?2:h==="CURRENT"?3:h==="RESET"?4:ee(39313,{state:h})}(e.targetChange.targetChangeType||"NO_CHANGE"),i=e.targetChange.targetIds||[],s=function(h,p){return h.useProto3Json?(fe(p===void 0||typeof p=="string",58123),Ze.fromBase64String(p||"")):(fe(p===void 0||p instanceof Buffer||p instanceof Uint8Array,16193),Ze.fromUint8Array(p||new Uint8Array))}(t,e.targetChange.resumeToken),o=e.targetChange.cause,l=o&&function(h){const p=h.code===void 0?U.UNKNOWN:jE(h.code);return new K(p,h.message||"")}(o);n=new WE(r,i,s,l||null)}else if("documentChange"in e){e.documentChange;const r=e.documentChange;r.document,r.document.name,r.document.updateTime;const i=Uc(t,r.document.name),s=hn(r.document.updateTime),o=r.document.createTime?hn(r.document.createTime):te.min(),l=new wt({mapValue:{fields:r.document.fields}}),u=lt.newFoundDocument(i,s,o,l),h=r.targetIds||[],p=r.removedTargetIds||[];n=new ll(h,p,u.key,u)}else if("documentDelete"in e){e.documentDelete;const r=e.documentDelete;r.document;const i=Uc(t,r.document),s=r.readTime?hn(r.readTime):te.min(),o=lt.newNoDocument(i,s),l=r.removedTargetIds||[];n=new ll([],l,o.key,o)}else if("documentRemove"in e){e.documentRemove;const r=e.documentRemove;r.document;const i=Uc(t,r.document),s=r.removedTargetIds||[];n=new ll([],s,i,null)}else{if(!("filter"in e))return ee(11601,{Vt:e});{e.filter;const r=e.filter;r.targetId;const{count:i=0,unchangedNames:s}=r,o=new uC(i,s),l=r.targetId;n=new $E(l,o)}}return n}function wC(t,e){let n;if(e instanceof Zo)n={update:zg(t,e.key,e.value)};else if(e instanceof gf)n={delete:Xh(t,e.key)};else if(e instanceof Dr)n={update:zg(t,e.key,e.data),updateMask:NC(e.fieldMask)};else{if(!(e instanceof oC))return ee(16599,{dt:e.type});n={verify:Xh(t,e.key)}}return e.fieldTransforms.length>0&&(n.updateTransforms=e.fieldTransforms.map(r=>function(s,o){const l=o.transform;if(l instanceof Hl)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(l instanceof Uo)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:l.elements}};if(l instanceof zo)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:l.elements}};if(l instanceof ql)return{fieldPath:o.field.canonicalString(),increment:l.Ae};throw ee(20930,{transform:o.transform})}(0,r))),e.precondition.isNone||(n.currentDocument=function(i,s){return s.updateTime!==void 0?{updateTime:vC(i,s.updateTime)}:s.exists!==void 0?{exists:s.exists}:ee(27497)}(t,e.precondition)),n}function TC(t,e){return t&&t.length>0?(fe(e!==void 0,14353),t.map(n=>function(i,s){let o=i.updateTime?hn(i.updateTime):hn(s);return o.isEqual(te.min())&&(o=hn(s)),new rC(o,i.transformResults||[])}(n,e))):[]}function IC(t,e){return{documents:[GE(t,e.path)]}}function SC(t,e){const n={structuredQuery:{}},r=e.path;let i;e.collectionGroup!==null?(i=r,n.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(i=r.popLast(),n.structuredQuery.from=[{collectionId:r.lastSegment()}]),n.parent=GE(t,i);const s=function(h){if(h.length!==0)return YE(yn.create(h,"and"))}(e.filters);s&&(n.structuredQuery.where=s);const o=function(h){if(h.length!==0)return h.map(p=>function(g){return{field:_i(g.field),direction:RC(g.dir)}}(p))}(e.orderBy);o&&(n.structuredQuery.orderBy=o);const l=Qh(t,e.limit);return l!==null&&(n.structuredQuery.limit=l),e.startAt&&(n.structuredQuery.startAt=function(h){return{before:h.inclusive,values:h.position}}(e.startAt)),e.endAt&&(n.structuredQuery.endAt=function(h){return{before:!h.inclusive,values:h.position}}(e.endAt)),{ft:n,parent:i}}function AC(t){let e=_C(t.parent);const n=t.structuredQuery,r=n.from?n.from.length:0;let i=null;if(r>0){fe(r===1,65062);const p=n.from[0];p.allDescendants?i=p.collectionId:e=e.child(p.collectionId)}let s=[];n.where&&(s=function(m){const g=QE(m);return g instanceof yn&&CE(g)?g.getFilters():[g]}(n.where));let o=[];n.orderBy&&(o=function(m){return m.map(g=>function(N){return new Wl(Ei(N.field),function(k){switch(k){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(N.direction))}(g))}(n.orderBy));let l=null;n.limit&&(l=function(m){let g;return g=typeof m=="object"?m.value:m,Tu(g)?null:g}(n.limit));let u=null;n.startAt&&(u=function(m){const g=!!m.before,_=m.values||[];return new $l(_,g)}(n.startAt));let h=null;return n.endAt&&(h=function(m){const g=!m.before,_=m.values||[];return new $l(_,g)}(n.endAt)),jA(e,i,o,s,l,"F",u,h)}function CC(t,e){const n=function(i){switch(i){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return ee(28987,{purpose:i})}}(e.purpose);return n==null?null:{"goog-listen-tags":n}}function QE(t){return t.unaryFilter!==void 0?function(n){switch(n.unaryFilter.op){case"IS_NAN":const r=Ei(n.unaryFilter.field);return ze.create(r,"==",{doubleValue:NaN});case"IS_NULL":const i=Ei(n.unaryFilter.field);return ze.create(i,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const s=Ei(n.unaryFilter.field);return ze.create(s,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Ei(n.unaryFilter.field);return ze.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return ee(61313);default:return ee(60726)}}(t):t.fieldFilter!==void 0?function(n){return ze.create(Ei(n.fieldFilter.field),function(i){switch(i){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return ee(58110);default:return ee(50506)}}(n.fieldFilter.op),n.fieldFilter.value)}(t):t.compositeFilter!==void 0?function(n){return yn.create(n.compositeFilter.filters.map(r=>QE(r)),function(i){switch(i){case"AND":return"and";case"OR":return"or";default:return ee(1026)}}(n.compositeFilter.op))}(t):ee(30097,{filter:t})}function RC(t){return pC[t]}function kC(t){return mC[t]}function PC(t){return gC[t]}function _i(t){return{fieldPath:t.canonicalString()}}function Ei(t){return Ye.fromServerFormat(t.fieldPath)}function YE(t){return t instanceof ze?function(n){if(n.op==="=="){if(Rg(n.value))return{unaryFilter:{field:_i(n.field),op:"IS_NAN"}};if(Cg(n.value))return{unaryFilter:{field:_i(n.field),op:"IS_NULL"}}}else if(n.op==="!="){if(Rg(n.value))return{unaryFilter:{field:_i(n.field),op:"IS_NOT_NAN"}};if(Cg(n.value))return{unaryFilter:{field:_i(n.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:_i(n.field),op:kC(n.op),value:n.value}}}(t):t instanceof yn?function(n){const r=n.getFilters().map(i=>YE(i));return r.length===1?r[0]:{compositeFilter:{op:PC(n.op),filters:r}}}(t):ee(54877,{filter:t})}function NC(t){const e=[];return t.fields.forEach(n=>e.push(n.canonicalString())),{fieldPaths:e}}function XE(t){return t.length>=4&&t.get(0)==="projects"&&t.get(2)==="databases"}function JE(t){return!!t&&typeof t._toProto=="function"&&t._protoValueType==="ProtoValue"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sr{constructor(e,n,r,i,s=te.min(),o=te.min(),l=Ze.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=n,this.purpose=r,this.sequenceNumber=i,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=l,this.expectedCount=u}withSequenceNumber(e){return new sr(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,n){return new sr(this.target,this.targetId,this.purpose,this.sequenceNumber,n,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new sr(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new sr(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xC{constructor(e){this.yt=e}}function bC(t){const e=AC({parent:t.parent,structuredQuery:t.structuredQuery});return t.limitType==="LAST"?Kh(e,e.limit,"L"):e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DC{constructor(){this.bn=new VC}addToCollectionParentIndex(e,n){return this.bn.add(n),F.resolve()}getCollectionParents(e,n){return F.resolve(this.bn.getEntries(n))}addFieldIndex(e,n){return F.resolve()}deleteFieldIndex(e,n){return F.resolve()}deleteAllFieldIndexes(e){return F.resolve()}createTargetIndexes(e,n){return F.resolve()}getDocumentsMatchingTarget(e,n){return F.resolve(null)}getIndexType(e,n){return F.resolve(0)}getFieldIndexes(e,n){return F.resolve([])}getNextCollectionGroupToUpdate(e){return F.resolve(null)}getMinOffset(e,n){return F.resolve(Tr.min())}getMinOffsetFromCollectionGroup(e,n){return F.resolve(Tr.min())}updateCollectionGroup(e,n,r){return F.resolve()}updateIndexEntries(e,n){return F.resolve()}}class VC{constructor(){this.index={}}add(e){const n=e.lastSegment(),r=e.popLast(),i=this.index[n]||new je(we.comparator),s=!i.has(r);return this.index[n]=i.add(r),s}has(e){const n=e.lastSegment(),r=e.popLast(),i=this.index[n];return i&&i.has(r)}getEntries(e){return(this.index[e]||new je(we.comparator)).toArray()}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bg={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},ZE=41943040;class _t{static withCacheSize(e){return new _t(e,_t.DEFAULT_COLLECTION_PERCENTILE,_t.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,n,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=n,this.maximumSequenceNumbersToCollect=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */_t.DEFAULT_COLLECTION_PERCENTILE=10,_t.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,_t.DEFAULT=new _t(ZE,_t.DEFAULT_COLLECTION_PERCENTILE,_t.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),_t.DISABLED=new _t(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class is{constructor(e){this.sr=e}next(){return this.sr+=2,this.sr}static _r(){return new is(0)}static ar(){return new is(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jg="LruGarbageCollector",OC=1048576;function $g([t,e],[n,r]){const i=ue(t,n);return i===0?ue(e,r):i}class LC{constructor(e){this.Pr=e,this.buffer=new je($g),this.Tr=0}Er(){return++this.Tr}Ir(e){const n=[e,this.Er()];if(this.buffer.size<this.Pr)this.buffer=this.buffer.add(n);else{const r=this.buffer.last();$g(n,r)<0&&(this.buffer=this.buffer.delete(r).add(n))}}get maxValue(){return this.buffer.last()[0]}}class MC{constructor(e,n,r){this.garbageCollector=e,this.asyncQueue=n,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Ar(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Ar(e){H(jg,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(n){ps(n)?H(jg,"Ignoring IndexedDB error during garbage collection: ",n):await fs(n)}await this.Ar(3e5)})}}class FC{constructor(e,n){this.Vr=e,this.params=n}calculateTargetCount(e,n){return this.Vr.dr(e).next(r=>Math.floor(n/100*r))}nthSequenceNumber(e,n){if(n===0)return F.resolve(wu.ce);const r=new LC(n);return this.Vr.forEachTarget(e,i=>r.Ir(i.sequenceNumber)).next(()=>this.Vr.mr(e,i=>r.Ir(i))).next(()=>r.maxValue)}removeTargets(e,n,r){return this.Vr.removeTargets(e,n,r)}removeOrphanedDocuments(e,n){return this.Vr.removeOrphanedDocuments(e,n)}collect(e,n){return this.params.cacheSizeCollectionThreshold===-1?(H("LruGarbageCollector","Garbage collection skipped; disabled"),F.resolve(Bg)):this.getCacheSize(e).next(r=>r<this.params.cacheSizeCollectionThreshold?(H("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Bg):this.gr(e,n))}getCacheSize(e){return this.Vr.getCacheSize(e)}gr(e,n){let r,i,s,o,l,u,h;const p=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(m=>(m>this.params.maximumSequenceNumbersToCollect?(H("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${m}`),i=this.params.maximumSequenceNumbersToCollect):i=m,o=Date.now(),this.nthSequenceNumber(e,i))).next(m=>(r=m,l=Date.now(),this.removeTargets(e,r,n))).next(m=>(s=m,u=Date.now(),this.removeOrphanedDocuments(e,r))).next(m=>(h=Date.now(),yi()<=le.DEBUG&&H("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-p}ms
	Determined least recently used ${i} in `+(l-o)+`ms
	Removed ${s} targets in `+(u-l)+`ms
	Removed ${m} documents in `+(h-u)+`ms
Total Duration: ${h-p}ms`),F.resolve({didRun:!0,sequenceNumbersCollected:i,targetsRemoved:s,documentsRemoved:m})))}}function UC(t,e){return new FC(t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zC{constructor(){this.changes=new ci(e=>e.toString(),(e,n)=>e.isEqual(n)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,n){this.assertNotApplied(),this.changes.set(e,lt.newInvalidDocument(e).setReadTime(n))}getEntry(e,n){this.assertNotApplied();const r=this.changes.get(n);return r!==void 0?F.resolve(r):this.getFromCache(e,n)}getEntries(e,n){return this.getAllFromCache(e,n)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class BC{constructor(e,n){this.overlayedDocument=e,this.mutatedFields=n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jC{constructor(e,n,r,i){this.remoteDocumentCache=e,this.mutationQueue=n,this.documentOverlayCache=r,this.indexManager=i}getDocument(e,n){let r=null;return this.documentOverlayCache.getOverlay(e,n).next(i=>(r=i,this.remoteDocumentCache.getEntry(e,n))).next(i=>(r!==null&&mo(r.mutation,i,Pt.empty(),Te.now()),i))}getDocuments(e,n){return this.remoteDocumentCache.getEntries(e,n).next(r=>this.getLocalViewOfDocuments(e,r,ce()).next(()=>r))}getLocalViewOfDocuments(e,n,r=ce()){const i=qr();return this.populateOverlays(e,i,n).next(()=>this.computeViews(e,n,i,r).next(s=>{let o=Zs();return s.forEach((l,u)=>{o=o.insert(l,u.overlayedDocument)}),o}))}getOverlayedDocuments(e,n){const r=qr();return this.populateOverlays(e,r,n).next(()=>this.computeViews(e,n,r,ce()))}populateOverlays(e,n,r){const i=[];return r.forEach(s=>{n.has(s)||i.push(s)}),this.documentOverlayCache.getOverlays(e,i).next(s=>{s.forEach((o,l)=>{n.set(o,l)})})}computeViews(e,n,r,i){let s=On();const o=po(),l=function(){return po()}();return n.forEach((u,h)=>{const p=r.get(h.key);i.has(h.key)&&(p===void 0||p.mutation instanceof Dr)?s=s.insert(h.key,h):p!==void 0?(o.set(h.key,p.mutation.getFieldMask()),mo(p.mutation,h,p.mutation.getFieldMask(),Te.now())):o.set(h.key,Pt.empty())}),this.recalculateAndSaveOverlays(e,s).next(u=>(u.forEach((h,p)=>o.set(h,p)),n.forEach((h,p)=>l.set(h,new BC(p,o.get(h)??null))),l))}recalculateAndSaveOverlays(e,n){const r=po();let i=new Pe((o,l)=>o-l),s=ce();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,n).next(o=>{for(const l of o)l.keys().forEach(u=>{const h=n.get(u);if(h===null)return;let p=r.get(u)||Pt.empty();p=l.applyToLocalView(h,p),r.set(u,p);const m=(i.get(l.batchId)||ce()).add(u);i=i.insert(l.batchId,m)})}).next(()=>{const o=[],l=i.getReverseIterator();for(;l.hasNext();){const u=l.getNext(),h=u.key,p=u.value,m=VE();p.forEach(g=>{if(!s.has(g)){const _=zE(n.get(g),r.get(g));_!==null&&m.set(g,_),s=s.add(g)}}),o.push(this.documentOverlayCache.saveOverlays(e,h,m))}return F.waitFor(o)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(e,n){return this.remoteDocumentCache.getEntries(e,n).next(r=>this.recalculateAndSaveOverlays(e,r))}getDocumentsMatchingQuery(e,n,r,i){return $A(n)?this.getDocumentsMatchingDocumentQuery(e,n.path):WA(n)?this.getDocumentsMatchingCollectionGroupQuery(e,n,r,i):this.getDocumentsMatchingCollectionQuery(e,n,r,i)}getNextDocuments(e,n,r,i){return this.remoteDocumentCache.getAllFromCollectionGroup(e,n,r,i).next(s=>{const o=i-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,n,r.largestBatchId,i-s.size):F.resolve(qr());let l=Oo,u=s;return o.next(h=>F.forEach(h,(p,m)=>(l<m.largestBatchId&&(l=m.largestBatchId),s.get(p)?F.resolve():this.remoteDocumentCache.getEntry(e,p).next(g=>{u=u.insert(p,g)}))).next(()=>this.populateOverlays(e,h,s)).next(()=>this.computeViews(e,u,h,ce())).next(p=>({batchId:l,changes:DE(p)})))})}getDocumentsMatchingDocumentQuery(e,n){return this.getDocument(e,new Y(n)).next(r=>{let i=Zs();return r.isFoundDocument()&&(i=i.insert(r.key,r)),i})}getDocumentsMatchingCollectionGroupQuery(e,n,r,i){const s=n.collectionGroup;let o=Zs();return this.indexManager.getCollectionParents(e,s).next(l=>F.forEach(l,u=>{const h=function(m,g){return new Su(g,null,m.explicitOrderBy.slice(),m.filters.slice(),m.limit,m.limitType,m.startAt,m.endAt)}(n,u.child(s));return this.getDocumentsMatchingCollectionQuery(e,h,r,i).next(p=>{p.forEach((m,g)=>{o=o.insert(m,g)})})}).next(()=>o))}getDocumentsMatchingCollectionQuery(e,n,r,i){let s;return this.documentOverlayCache.getOverlaysForCollection(e,n.path,r.largestBatchId).next(o=>(s=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,n,r,s,i))).next(o=>{s.forEach((u,h)=>{const p=h.getKey();o.get(p)===null&&(o=o.insert(p,lt.newInvalidDocument(p)))});let l=Zs();return o.forEach((u,h)=>{const p=s.get(u);p!==void 0&&mo(p.mutation,h,Pt.empty(),Te.now()),Cu(n,h)&&(l=l.insert(u,h))}),l})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $C{constructor(e){this.serializer=e,this.Nr=new Map,this.Br=new Map}getBundleMetadata(e,n){return F.resolve(this.Nr.get(n))}saveBundleMetadata(e,n){return this.Nr.set(n.id,function(i){return{id:i.id,version:i.version,createTime:hn(i.createTime)}}(n)),F.resolve()}getNamedQuery(e,n){return F.resolve(this.Br.get(n))}saveNamedQuery(e,n){return this.Br.set(n.name,function(i){return{name:i.name,query:bC(i.bundledQuery),readTime:hn(i.readTime)}}(n)),F.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WC{constructor(){this.overlays=new Pe(Y.comparator),this.Lr=new Map}getOverlay(e,n){return F.resolve(this.overlays.get(n))}getOverlays(e,n){const r=qr();return F.forEach(n,i=>this.getOverlay(e,i).next(s=>{s!==null&&r.set(i,s)})).next(()=>r)}saveOverlays(e,n,r){return r.forEach((i,s)=>{this.St(e,n,s)}),F.resolve()}removeOverlaysForBatchId(e,n,r){const i=this.Lr.get(r);return i!==void 0&&(i.forEach(s=>this.overlays=this.overlays.remove(s)),this.Lr.delete(r)),F.resolve()}getOverlaysForCollection(e,n,r){const i=qr(),s=n.length+1,o=new Y(n.child("")),l=this.overlays.getIteratorFrom(o);for(;l.hasNext();){const u=l.getNext().value,h=u.getKey();if(!n.isPrefixOf(h.path))break;h.path.length===s&&u.largestBatchId>r&&i.set(u.getKey(),u)}return F.resolve(i)}getOverlaysForCollectionGroup(e,n,r,i){let s=new Pe((h,p)=>h-p);const o=this.overlays.getIterator();for(;o.hasNext();){const h=o.getNext().value;if(h.getKey().getCollectionGroup()===n&&h.largestBatchId>r){let p=s.get(h.largestBatchId);p===null&&(p=qr(),s=s.insert(h.largestBatchId,p)),p.set(h.getKey(),h)}}const l=qr(),u=s.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach((h,p)=>l.set(h,p)),!(l.size()>=i)););return F.resolve(l)}St(e,n,r){const i=this.overlays.get(r.key);if(i!==null){const o=this.Lr.get(i.largestBatchId).delete(r.key);this.Lr.set(i.largestBatchId,o)}this.overlays=this.overlays.insert(r.key,new lC(n,r));let s=this.Lr.get(n);s===void 0&&(s=ce(),this.Lr.set(n,s)),this.Lr.set(n,s.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class HC{constructor(){this.sessionToken=Ze.EMPTY_BYTE_STRING}getSessionToken(e){return F.resolve(this.sessionToken)}setSessionToken(e,n){return this.sessionToken=n,F.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ef{constructor(){this.kr=new je(We.qr),this.Kr=new je(We.Ur)}isEmpty(){return this.kr.isEmpty()}addReference(e,n){const r=new We(e,n);this.kr=this.kr.add(r),this.Kr=this.Kr.add(r)}$r(e,n){e.forEach(r=>this.addReference(r,n))}removeReference(e,n){this.Wr(new We(e,n))}Qr(e,n){e.forEach(r=>this.removeReference(r,n))}Gr(e){const n=new Y(new we([])),r=new We(n,e),i=new We(n,e+1),s=[];return this.Kr.forEachInRange([r,i],o=>{this.Wr(o),s.push(o.key)}),s}zr(){this.kr.forEach(e=>this.Wr(e))}Wr(e){this.kr=this.kr.delete(e),this.Kr=this.Kr.delete(e)}jr(e){const n=new Y(new we([])),r=new We(n,e),i=new We(n,e+1);let s=ce();return this.Kr.forEachInRange([r,i],o=>{s=s.add(o.key)}),s}containsKey(e){const n=new We(e,0),r=this.kr.firstAfterOrEqual(n);return r!==null&&e.isEqual(r.key)}}class We{constructor(e,n){this.key=e,this.Jr=n}static qr(e,n){return Y.comparator(e.key,n.key)||ue(e.Jr,n.Jr)}static Ur(e,n){return ue(e.Jr,n.Jr)||Y.comparator(e.key,n.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qC{constructor(e,n){this.indexManager=e,this.referenceDelegate=n,this.mutationQueue=[],this.Yn=1,this.Hr=new je(We.qr)}checkEmpty(e){return F.resolve(this.mutationQueue.length===0)}addMutationBatch(e,n,r,i){const s=this.Yn;this.Yn++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new aC(s,n,r,i);this.mutationQueue.push(o);for(const l of i)this.Hr=this.Hr.add(new We(l.key,s)),this.indexManager.addToCollectionParentIndex(e,l.key.path.popLast());return F.resolve(o)}lookupMutationBatch(e,n){return F.resolve(this.Zr(n))}getNextMutationBatchAfterBatchId(e,n){const r=n+1,i=this.Xr(r),s=i<0?0:i;return F.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return F.resolve(this.mutationQueue.length===0?uf:this.Yn-1)}getAllMutationBatches(e){return F.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,n){const r=new We(n,0),i=new We(n,Number.POSITIVE_INFINITY),s=[];return this.Hr.forEachInRange([r,i],o=>{const l=this.Zr(o.Jr);s.push(l)}),F.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(e,n){let r=new je(ue);return n.forEach(i=>{const s=new We(i,0),o=new We(i,Number.POSITIVE_INFINITY);this.Hr.forEachInRange([s,o],l=>{r=r.add(l.Jr)})}),F.resolve(this.Yr(r))}getAllMutationBatchesAffectingQuery(e,n){const r=n.path,i=r.length+1;let s=r;Y.isDocumentKey(s)||(s=s.child(""));const o=new We(new Y(s),0);let l=new je(ue);return this.Hr.forEachWhile(u=>{const h=u.key.path;return!!r.isPrefixOf(h)&&(h.length===i&&(l=l.add(u.Jr)),!0)},o),F.resolve(this.Yr(l))}Yr(e){const n=[];return e.forEach(r=>{const i=this.Zr(r);i!==null&&n.push(i)}),n}removeMutationBatch(e,n){fe(this.ei(n.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Hr;return F.forEach(n.mutations,i=>{const s=new We(i.key,n.batchId);return r=r.delete(s),this.referenceDelegate.markPotentiallyOrphaned(e,i.key)}).next(()=>{this.Hr=r})}nr(e){}containsKey(e,n){const r=new We(n,0),i=this.Hr.firstAfterOrEqual(r);return F.resolve(n.isEqual(i&&i.key))}performConsistencyCheck(e){return this.mutationQueue.length,F.resolve()}ei(e,n){return this.Xr(e)}Xr(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Zr(e){const n=this.Xr(e);return n<0||n>=this.mutationQueue.length?null:this.mutationQueue[n]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class GC{constructor(e){this.ti=e,this.docs=function(){return new Pe(Y.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,n){const r=n.key,i=this.docs.get(r),s=i?i.size:0,o=this.ti(n);return this.docs=this.docs.insert(r,{document:n.mutableCopy(),size:o}),this.size+=o-s,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){const n=this.docs.get(e);n&&(this.docs=this.docs.remove(e),this.size-=n.size)}getEntry(e,n){const r=this.docs.get(n);return F.resolve(r?r.document.mutableCopy():lt.newInvalidDocument(n))}getEntries(e,n){let r=On();return n.forEach(i=>{const s=this.docs.get(i);r=r.insert(i,s?s.document.mutableCopy():lt.newInvalidDocument(i))}),F.resolve(r)}getDocumentsMatchingQuery(e,n,r,i){let s=On();const o=n.path,l=new Y(o.child("__id-9223372036854775808__")),u=this.docs.getIteratorFrom(l);for(;u.hasNext();){const{key:h,value:{document:p}}=u.getNext();if(!o.isPrefixOf(h.path))break;h.path.length>o.length+1||_A(vA(p),r)<=0||(i.has(p.key)||Cu(n,p))&&(s=s.insert(p.key,p.mutableCopy()))}return F.resolve(s)}getAllFromCollectionGroup(e,n,r,i){ee(9500)}ni(e,n){return F.forEach(this.docs,r=>n(r))}newChangeBuffer(e){return new KC(this)}getSize(e){return F.resolve(this.size)}}class KC extends zC{constructor(e){super(),this.Mr=e}applyChanges(e){const n=[];return this.changes.forEach((r,i)=>{i.isValidDocument()?n.push(this.Mr.addEntry(e,i)):this.Mr.removeEntry(r)}),F.waitFor(n)}getFromCache(e,n){return this.Mr.getEntry(e,n)}getAllFromCache(e,n){return this.Mr.getEntries(e,n)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class QC{constructor(e){this.persistence=e,this.ri=new ci(n=>df(n),ff),this.lastRemoteSnapshotVersion=te.min(),this.highestTargetId=0,this.ii=0,this.si=new Ef,this.targetCount=0,this.oi=is._r()}forEachTarget(e,n){return this.ri.forEach((r,i)=>n(i)),F.resolve()}getLastRemoteSnapshotVersion(e){return F.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return F.resolve(this.ii)}allocateTargetId(e){return this.highestTargetId=this.oi.next(),F.resolve(this.highestTargetId)}setTargetsMetadata(e,n,r){return r&&(this.lastRemoteSnapshotVersion=r),n>this.ii&&(this.ii=n),F.resolve()}lr(e){this.ri.set(e.target,e);const n=e.targetId;n>this.highestTargetId&&(this.oi=new is(n),this.highestTargetId=n),e.sequenceNumber>this.ii&&(this.ii=e.sequenceNumber)}addTargetData(e,n){return this.lr(n),this.targetCount+=1,F.resolve()}updateTargetData(e,n){return this.lr(n),F.resolve()}removeTargetData(e,n){return this.ri.delete(n.target),this.si.Gr(n.targetId),this.targetCount-=1,F.resolve()}removeTargets(e,n,r){let i=0;const s=[];return this.ri.forEach((o,l)=>{l.sequenceNumber<=n&&r.get(l.targetId)===null&&(this.ri.delete(o),s.push(this.removeMatchingKeysForTargetId(e,l.targetId)),i++)}),F.waitFor(s).next(()=>i)}getTargetCount(e){return F.resolve(this.targetCount)}getTargetData(e,n){const r=this.ri.get(n)||null;return F.resolve(r)}addMatchingKeys(e,n,r){return this.si.$r(n,r),F.resolve()}removeMatchingKeys(e,n,r){this.si.Qr(n,r);const i=this.persistence.referenceDelegate,s=[];return i&&n.forEach(o=>{s.push(i.markPotentiallyOrphaned(e,o))}),F.waitFor(s)}removeMatchingKeysForTargetId(e,n){return this.si.Gr(n),F.resolve()}getMatchingKeysForTargetId(e,n){const r=this.si.jr(n);return F.resolve(r)}containsKey(e,n){return F.resolve(this.si.containsKey(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ew{constructor(e,n){this._i={},this.overlays={},this.ai=new wu(0),this.ui=!1,this.ui=!0,this.ci=new HC,this.referenceDelegate=e(this),this.li=new QC(this),this.indexManager=new DC,this.remoteDocumentCache=function(i){return new GC(i)}(r=>this.referenceDelegate.hi(r)),this.serializer=new xC(n),this.Pi=new $C(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ui=!1,Promise.resolve()}get started(){return this.ui}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let n=this.overlays[e.toKey()];return n||(n=new WC,this.overlays[e.toKey()]=n),n}getMutationQueue(e,n){let r=this._i[e.toKey()];return r||(r=new qC(n,this.referenceDelegate),this._i[e.toKey()]=r),r}getGlobalsCache(){return this.ci}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Pi}runTransaction(e,n,r){H("MemoryPersistence","Starting transaction:",e);const i=new YC(this.ai.next());return this.referenceDelegate.Ti(),r(i).next(s=>this.referenceDelegate.Ei(i).next(()=>s)).toPromise().then(s=>(i.raiseOnCommittedEvent(),s))}Ii(e,n){return F.or(Object.values(this._i).map(r=>()=>r.containsKey(e,n)))}}class YC extends wA{constructor(e){super(),this.currentSequenceNumber=e}}class wf{constructor(e){this.persistence=e,this.Ri=new Ef,this.Ai=null}static Vi(e){return new wf(e)}get di(){if(this.Ai)return this.Ai;throw ee(60996)}addReference(e,n,r){return this.Ri.addReference(r,n),this.di.delete(r.toString()),F.resolve()}removeReference(e,n,r){return this.Ri.removeReference(r,n),this.di.add(r.toString()),F.resolve()}markPotentiallyOrphaned(e,n){return this.di.add(n.toString()),F.resolve()}removeTarget(e,n){this.Ri.Gr(n.targetId).forEach(i=>this.di.add(i.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,n.targetId).next(i=>{i.forEach(s=>this.di.add(s.toString()))}).next(()=>r.removeTargetData(e,n))}Ti(){this.Ai=new Set}Ei(e){const n=this.persistence.getRemoteDocumentCache().newChangeBuffer();return F.forEach(this.di,r=>{const i=Y.fromPath(r);return this.mi(e,i).next(s=>{s||n.removeEntry(i,te.min())})}).next(()=>(this.Ai=null,n.apply(e)))}updateLimboDocument(e,n){return this.mi(e,n).next(r=>{r?this.di.delete(n.toString()):this.di.add(n.toString())})}hi(e){return 0}mi(e,n){return F.or([()=>F.resolve(this.Ri.containsKey(n)),()=>this.persistence.getTargetCache().containsKey(e,n),()=>this.persistence.Ii(e,n)])}}class Kl{constructor(e,n){this.persistence=e,this.fi=new ci(r=>SA(r.path),(r,i)=>r.isEqual(i)),this.garbageCollector=UC(this,n)}static Vi(e,n){return new Kl(e,n)}Ti(){}Ei(e){return F.resolve()}forEachTarget(e,n){return this.persistence.getTargetCache().forEachTarget(e,n)}dr(e){const n=this.pr(e);return this.persistence.getTargetCache().getTargetCount(e).next(r=>n.next(i=>r+i))}pr(e){let n=0;return this.mr(e,r=>{n++}).next(()=>n)}mr(e,n){return F.forEach(this.fi,(r,i)=>this.wr(e,r,i).next(s=>s?F.resolve():n(i)))}removeTargets(e,n,r){return this.persistence.getTargetCache().removeTargets(e,n,r)}removeOrphanedDocuments(e,n){let r=0;const i=this.persistence.getRemoteDocumentCache(),s=i.newChangeBuffer();return i.ni(e,o=>this.wr(e,o,n).next(l=>{l||(r++,s.removeEntry(o,te.min()))})).next(()=>s.apply(e)).next(()=>r)}markPotentiallyOrphaned(e,n){return this.fi.set(n,e.currentSequenceNumber),F.resolve()}removeTarget(e,n){const r=n.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,r)}addReference(e,n,r){return this.fi.set(r,e.currentSequenceNumber),F.resolve()}removeReference(e,n,r){return this.fi.set(r,e.currentSequenceNumber),F.resolve()}updateLimboDocument(e,n){return this.fi.set(n,e.currentSequenceNumber),F.resolve()}hi(e){let n=e.key.toString().length;return e.isFoundDocument()&&(n+=sl(e.data.value)),n}wr(e,n,r){return F.or([()=>this.persistence.Ii(e,n),()=>this.persistence.getTargetCache().containsKey(e,n),()=>{const i=this.fi.get(n);return F.resolve(i!==void 0&&i>r)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tf{constructor(e,n,r,i){this.targetId=e,this.fromCache=n,this.Ts=r,this.Es=i}static Is(e,n){let r=ce(),i=ce();for(const s of n.docChanges)switch(s.type){case 0:r=r.add(s.doc.key);break;case 1:i=i.add(s.doc.key)}return new Tf(e,n.fromCache,r,i)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class XC{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class JC{constructor(){this.Rs=!1,this.As=!1,this.Vs=100,this.ds=function(){return US()?8:TA(ct())>0?6:4}()}initialize(e,n){this.fs=e,this.indexManager=n,this.Rs=!0}getDocumentsMatchingQuery(e,n,r,i){const s={result:null};return this.gs(e,n).next(o=>{s.result=o}).next(()=>{if(!s.result)return this.ps(e,n,i,r).next(o=>{s.result=o})}).next(()=>{if(s.result)return;const o=new XC;return this.ys(e,n,o).next(l=>{if(s.result=l,this.As)return this.ws(e,n,o,l.size)})}).next(()=>s.result)}ws(e,n,r,i){return r.documentReadCount<this.Vs?(yi()<=le.DEBUG&&H("QueryEngine","SDK will not create cache indexes for query:",vi(n),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),F.resolve()):(yi()<=le.DEBUG&&H("QueryEngine","Query:",vi(n),"scans",r.documentReadCount,"local documents and returns",i,"documents as results."),r.documentReadCount>this.ds*i?(yi()<=le.DEBUG&&H("QueryEngine","The SDK decides to create cache indexes for query:",vi(n),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,cn(n))):F.resolve())}gs(e,n){if(xg(n))return F.resolve(null);let r=cn(n);return this.indexManager.getIndexType(e,r).next(i=>i===0?null:(n.limit!==null&&i===1&&(n=Kh(n,null,"F"),r=cn(n)),this.indexManager.getDocumentsMatchingTarget(e,r).next(s=>{const o=ce(...s);return this.fs.getDocuments(e,o).next(l=>this.indexManager.getMinOffset(e,r).next(u=>{const h=this.Ss(n,l);return this.bs(n,h,o,u.readTime)?this.gs(e,Kh(n,null,"F")):this.Ds(e,h,n,u)}))})))}ps(e,n,r,i){return xg(n)||i.isEqual(te.min())?F.resolve(null):this.fs.getDocuments(e,r).next(s=>{const o=this.Ss(n,s);return this.bs(n,o,r,i)?F.resolve(null):(yi()<=le.DEBUG&&H("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),vi(n)),this.Ds(e,o,n,yA(i,Oo)).next(l=>l))})}Ss(e,n){let r=new je(xE(e));return n.forEach((i,s)=>{Cu(e,s)&&(r=r.add(s))}),r}bs(e,n,r,i){if(e.limit===null)return!1;if(r.size!==n.size)return!0;const s=e.limitType==="F"?n.last():n.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(i)>0)}ys(e,n,r){return yi()<=le.DEBUG&&H("QueryEngine","Using full collection scan to execute query:",vi(n)),this.fs.getDocumentsMatchingQuery(e,n,Tr.min(),r)}Ds(e,n,r,i){return this.fs.getDocumentsMatchingQuery(e,r,i).next(s=>(n.forEach(o=>{s=s.insert(o.key,o)}),s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const If="LocalStore",ZC=3e8;class eR{constructor(e,n,r,i){this.persistence=e,this.Cs=n,this.serializer=i,this.vs=new Pe(ue),this.Fs=new ci(s=>df(s),ff),this.Ms=new Map,this.xs=e.getRemoteDocumentCache(),this.li=e.getTargetCache(),this.Pi=e.getBundleCache(),this.Os(r)}Os(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new jC(this.xs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.xs.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",n=>e.collect(n,this.vs))}}function tR(t,e,n,r){return new eR(t,e,n,r)}async function tw(t,e){const n=ne(t);return await n.persistence.runTransaction("Handle user change","readonly",r=>{let i;return n.mutationQueue.getAllMutationBatches(r).next(s=>(i=s,n.Os(e),n.mutationQueue.getAllMutationBatches(r))).next(s=>{const o=[],l=[];let u=ce();for(const h of i){o.push(h.batchId);for(const p of h.mutations)u=u.add(p.key)}for(const h of s){l.push(h.batchId);for(const p of h.mutations)u=u.add(p.key)}return n.localDocuments.getDocuments(r,u).next(h=>({Ns:h,removedBatchIds:o,addedBatchIds:l}))})})}function nR(t,e){const n=ne(t);return n.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{const i=e.batch.keys(),s=n.xs.newChangeBuffer({trackRemovals:!0});return function(l,u,h,p){const m=h.batch,g=m.keys();let _=F.resolve();return g.forEach(N=>{_=_.next(()=>p.getEntry(u,N)).next(R=>{const k=h.docVersions.get(N);fe(k!==null,48541),R.version.compareTo(k)<0&&(m.applyToRemoteDocument(R,h),R.isValidDocument()&&(R.setReadTime(h.commitVersion),p.addEntry(R)))})}),_.next(()=>l.mutationQueue.removeMutationBatch(u,m))}(n,r,e,s).next(()=>s.apply(r)).next(()=>n.mutationQueue.performConsistencyCheck(r)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(r,i,e.batch.batchId)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(l){let u=ce();for(let h=0;h<l.mutationResults.length;++h)l.mutationResults[h].transformResults.length>0&&(u=u.add(l.batch.mutations[h].key));return u}(e))).next(()=>n.localDocuments.getDocuments(r,i))})}function nw(t){const e=ne(t);return e.persistence.runTransaction("Get last remote snapshot version","readonly",n=>e.li.getLastRemoteSnapshotVersion(n))}function rR(t,e){const n=ne(t),r=e.snapshotVersion;let i=n.vs;return n.persistence.runTransaction("Apply remote event","readwrite-primary",s=>{const o=n.xs.newChangeBuffer({trackRemovals:!0});i=n.vs;const l=[];e.targetChanges.forEach((p,m)=>{const g=i.get(m);if(!g)return;l.push(n.li.removeMatchingKeys(s,p.removedDocuments,m).next(()=>n.li.addMatchingKeys(s,p.addedDocuments,m)));let _=g.withSequenceNumber(s.currentSequenceNumber);e.targetMismatches.get(m)!==null?_=_.withResumeToken(Ze.EMPTY_BYTE_STRING,te.min()).withLastLimboFreeSnapshotVersion(te.min()):p.resumeToken.approximateByteSize()>0&&(_=_.withResumeToken(p.resumeToken,r)),i=i.insert(m,_),function(R,k,I){return R.resumeToken.approximateByteSize()===0||k.snapshotVersion.toMicroseconds()-R.snapshotVersion.toMicroseconds()>=ZC?!0:I.addedDocuments.size+I.modifiedDocuments.size+I.removedDocuments.size>0}(g,_,p)&&l.push(n.li.updateTargetData(s,_))});let u=On(),h=ce();if(e.documentUpdates.forEach(p=>{e.resolvedLimboDocuments.has(p)&&l.push(n.persistence.referenceDelegate.updateLimboDocument(s,p))}),l.push(iR(s,o,e.documentUpdates).next(p=>{u=p.Bs,h=p.Ls})),!r.isEqual(te.min())){const p=n.li.getLastRemoteSnapshotVersion(s).next(m=>n.li.setTargetsMetadata(s,s.currentSequenceNumber,r));l.push(p)}return F.waitFor(l).next(()=>o.apply(s)).next(()=>n.localDocuments.getLocalViewOfDocuments(s,u,h)).next(()=>u)}).then(s=>(n.vs=i,s))}function iR(t,e,n){let r=ce(),i=ce();return n.forEach(s=>r=r.add(s)),e.getEntries(t,r).next(s=>{let o=On();return n.forEach((l,u)=>{const h=s.get(l);u.isFoundDocument()!==h.isFoundDocument()&&(i=i.add(l)),u.isNoDocument()&&u.version.isEqual(te.min())?(e.removeEntry(l,u.readTime),o=o.insert(l,u)):!h.isValidDocument()||u.version.compareTo(h.version)>0||u.version.compareTo(h.version)===0&&h.hasPendingWrites?(e.addEntry(u),o=o.insert(l,u)):H(If,"Ignoring outdated watch update for ",l,". Current version:",h.version," Watch version:",u.version)}),{Bs:o,Ls:i}})}function sR(t,e){const n=ne(t);return n.persistence.runTransaction("Get next mutation batch","readonly",r=>(e===void 0&&(e=uf),n.mutationQueue.getNextMutationBatchAfterBatchId(r,e)))}function oR(t,e){const n=ne(t);return n.persistence.runTransaction("Allocate target","readwrite",r=>{let i;return n.li.getTargetData(r,e).next(s=>s?(i=s,F.resolve(i)):n.li.allocateTargetId(r).next(o=>(i=new sr(e,o,"TargetPurposeListen",r.currentSequenceNumber),n.li.addTargetData(r,i).next(()=>i))))}).then(r=>{const i=n.vs.get(r.targetId);return(i===null||r.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(n.vs=n.vs.insert(r.targetId,r),n.Fs.set(e,r.targetId)),r})}async function Zh(t,e,n){const r=ne(t),i=r.vs.get(e),s=n?"readwrite":"readwrite-primary";try{n||await r.persistence.runTransaction("Release target",s,o=>r.persistence.referenceDelegate.removeTarget(o,i))}catch(o){if(!ps(o))throw o;H(If,`Failed to update sequence numbers for target ${e}: ${o}`)}r.vs=r.vs.remove(e),r.Fs.delete(i.target)}function Wg(t,e,n){const r=ne(t);let i=te.min(),s=ce();return r.persistence.runTransaction("Execute query","readwrite",o=>function(u,h,p){const m=ne(u),g=m.Fs.get(p);return g!==void 0?F.resolve(m.vs.get(g)):m.li.getTargetData(h,p)}(r,o,cn(e)).next(l=>{if(l)return i=l.lastLimboFreeSnapshotVersion,r.li.getMatchingKeysForTargetId(o,l.targetId).next(u=>{s=u})}).next(()=>r.Cs.getDocumentsMatchingQuery(o,e,n?i:te.min(),n?s:ce())).next(l=>(aR(r,qA(e),l),{documents:l,ks:s})))}function aR(t,e,n){let r=t.Ms.get(e)||te.min();n.forEach((i,s)=>{s.readTime.compareTo(r)>0&&(r=s.readTime)}),t.Ms.set(e,r)}class Hg{constructor(){this.activeTargetIds=JA()}Qs(e){this.activeTargetIds=this.activeTargetIds.add(e)}Gs(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Ws(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class lR{constructor(){this.vo=new Hg,this.Fo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,n,r){}addLocalQueryTarget(e,n=!0){return n&&this.vo.Qs(e),this.Fo[e]||"not-current"}updateQueryState(e,n,r){this.Fo[e]=n}removeLocalQueryTarget(e){this.vo.Gs(e)}isLocalQueryTarget(e){return this.vo.activeTargetIds.has(e)}clearQueryState(e){delete this.Fo[e]}getAllActiveQueryTargets(){return this.vo.activeTargetIds}isActiveQueryTarget(e){return this.vo.activeTargetIds.has(e)}start(){return this.vo=new Hg,Promise.resolve()}handleUserChange(e,n,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uR{Mo(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qg="ConnectivityMonitor";class Gg{constructor(){this.xo=()=>this.Oo(),this.No=()=>this.Bo(),this.Lo=[],this.ko()}Mo(e){this.Lo.push(e)}shutdown(){window.removeEventListener("online",this.xo),window.removeEventListener("offline",this.No)}ko(){window.addEventListener("online",this.xo),window.addEventListener("offline",this.No)}Oo(){H(qg,"Network connectivity changed: AVAILABLE");for(const e of this.Lo)e(0)}Bo(){H(qg,"Network connectivity changed: UNAVAILABLE");for(const e of this.Lo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ja=null;function ed(){return ja===null?ja=function(){return 268435456+Math.round(2147483648*Math.random())}():ja++,"0x"+ja.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zc="RestConnection",cR={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class hR{get qo(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const n=e.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.Ko=n+"://"+e.host,this.Uo=`projects/${r}/databases/${i}`,this.$o=this.databaseId.database===Bl?`project_id=${r}`:`project_id=${r}&database_id=${i}`}Wo(e,n,r,i,s){const o=ed(),l=this.Qo(e,n.toUriEncodedString());H(zc,`Sending RPC '${e}' ${o}:`,l,r);const u={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.$o};this.Go(u,i,s);const{host:h}=new URL(l),p=Xo(h);return this.zo(e,l,u,r,p).then(m=>(H(zc,`Received RPC '${e}' ${o}: `,m),m),m=>{throw ii(zc,`RPC '${e}' ${o} failed with error: `,m,"url: ",l,"request:",r),m})}jo(e,n,r,i,s,o){return this.Wo(e,n,r,i,s)}Go(e,n,r){e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+ds}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),n&&n.headers.forEach((i,s)=>e[s]=i),r&&r.headers.forEach((i,s)=>e[s]=i)}Qo(e,n){const r=cR[e];let i=`${this.Ko}/v1/${n}:${r}`;return this.databaseInfo.apiKey&&(i=`${i}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),i}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dR{constructor(e){this.Jo=e.Jo,this.Ho=e.Ho}Zo(e){this.Xo=e}Yo(e){this.e_=e}t_(e){this.n_=e}onMessage(e){this.r_=e}close(){this.Ho()}send(e){this.Jo(e)}i_(){this.Xo()}s_(){this.e_()}o_(e){this.n_(e)}__(e){this.r_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const st="WebChannelConnection",Ws=(t,e,n)=>{t.listen(e,r=>{try{n(r)}catch(i){setTimeout(()=>{throw i},0)}})};class Bi extends hR{constructor(e){super(e),this.a_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static u_(){if(!Bi.c_){const e=lE();Ws(e,aE.STAT_EVENT,n=>{n.stat===jh.PROXY?H(st,"STAT_EVENT: detected buffering proxy"):n.stat===jh.NOPROXY&&H(st,"STAT_EVENT: detected no buffering proxy")}),Bi.c_=!0}}zo(e,n,r,i,s){const o=ed();return new Promise((l,u)=>{const h=new sE;h.setWithCredentials(!0),h.listenOnce(oE.COMPLETE,()=>{try{switch(h.getLastErrorCode()){case il.NO_ERROR:const m=h.getResponseJson();H(st,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(m)),l(m);break;case il.TIMEOUT:H(st,`RPC '${e}' ${o} timed out`),u(new K(U.DEADLINE_EXCEEDED,"Request time out"));break;case il.HTTP_ERROR:const g=h.getStatus();if(H(st,`RPC '${e}' ${o} failed with status:`,g,"response text:",h.getResponseText()),g>0){let _=h.getResponseJson();Array.isArray(_)&&(_=_[0]);const N=_==null?void 0:_.error;if(N&&N.status&&N.message){const R=function(I){const T=I.toLowerCase().replace(/_/g,"-");return Object.values(U).indexOf(T)>=0?T:U.UNKNOWN}(N.status);u(new K(R,N.message))}else u(new K(U.UNKNOWN,"Server responded with status "+h.getStatus()))}else u(new K(U.UNAVAILABLE,"Connection failed."));break;default:ee(9055,{l_:e,streamId:o,h_:h.getLastErrorCode(),P_:h.getLastError()})}}finally{H(st,`RPC '${e}' ${o} completed.`)}});const p=JSON.stringify(i);H(st,`RPC '${e}' ${o} sending request:`,i),h.send(n,"POST",p,r,15)})}T_(e,n,r){const i=ed(),s=[this.Ko,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=this.createWebChannelTransport(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(l.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(l.useFetchStreams=!0),this.Go(l.initMessageHeaders,n,r),l.encodeInitMessageHeaders=!0;const h=s.join("");H(st,`Creating RPC '${e}' stream ${i}: ${h}`,l);const p=o.createWebChannel(h,l);this.E_(p);let m=!1,g=!1;const _=new dR({Jo:N=>{g?H(st,`Not sending because RPC '${e}' stream ${i} is closed:`,N):(m||(H(st,`Opening RPC '${e}' stream ${i} transport.`),p.open(),m=!0),H(st,`RPC '${e}' stream ${i} sending:`,N),p.send(N))},Ho:()=>p.close()});return Ws(p,Js.EventType.OPEN,()=>{g||(H(st,`RPC '${e}' stream ${i} transport opened.`),_.i_())}),Ws(p,Js.EventType.CLOSE,()=>{g||(g=!0,H(st,`RPC '${e}' stream ${i} transport closed`),_.o_(),this.I_(p))}),Ws(p,Js.EventType.ERROR,N=>{g||(g=!0,ii(st,`RPC '${e}' stream ${i} transport errored. Name:`,N.name,"Message:",N.message),_.o_(new K(U.UNAVAILABLE,"The operation could not be completed")))}),Ws(p,Js.EventType.MESSAGE,N=>{var R;if(!g){const k=N.data[0];fe(!!k,16349);const I=k,T=(I==null?void 0:I.error)||((R=I[0])==null?void 0:R.error);if(T){H(st,`RPC '${e}' stream ${i} received error:`,T);const P=T.status;let b=function(w){const v=Ve[w];if(v!==void 0)return jE(v)}(P),V=T.message;P==="NOT_FOUND"&&V.includes("database")&&V.includes("does not exist")&&V.includes(this.databaseId.database)&&ii(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),b===void 0&&(b=U.INTERNAL,V="Unknown error status: "+P+" with message "+T.message),g=!0,_.o_(new K(b,V)),p.close()}else H(st,`RPC '${e}' stream ${i} received:`,k),_.__(k)}}),Bi.u_(),setTimeout(()=>{_.s_()},0),_}terminate(){this.a_.forEach(e=>e.close()),this.a_=[]}E_(e){this.a_.push(e)}I_(e){this.a_=this.a_.filter(n=>n===e)}Go(e,n,r){super.Go(e,n,r),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return uE()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fR(t){return new Bi(t)}function Bc(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nu(t){return new yC(t,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Bi.c_=!1;class rw{constructor(e,n,r=1e3,i=1.5,s=6e4){this.Ci=e,this.timerId=n,this.R_=r,this.A_=i,this.V_=s,this.d_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.d_=0}g_(){this.d_=this.V_}p_(e){this.cancel();const n=Math.floor(this.d_+this.y_()),r=Math.max(0,Date.now()-this.f_),i=Math.max(0,n-r);i>0&&H("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.d_} ms, delay with jitter: ${n} ms, last attempt: ${r} ms ago)`),this.m_=this.Ci.enqueueAfterDelay(this.timerId,i,()=>(this.f_=Date.now(),e())),this.d_*=this.A_,this.d_<this.R_&&(this.d_=this.R_),this.d_>this.V_&&(this.d_=this.V_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.d_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kg="PersistentStream";class iw{constructor(e,n,r,i,s,o,l,u){this.Ci=e,this.S_=r,this.b_=i,this.connection=s,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=l,this.listener=u,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new rw(e,n)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Ci.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(e){this.K_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}K_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,n){this.K_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():n&&n.code===U.RESOURCE_EXHAUSTED?(Vn(n.toString()),Vn("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):n&&n.code===U.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.W_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.t_(n)}W_(){}auth(){this.state=1;const e=this.Q_(this.D_),n=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,i])=>{this.D_===n&&this.G_(r,i)},r=>{e(()=>{const i=new K(U.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(i)})})}G_(e,n){const r=this.Q_(this.D_);this.stream=this.j_(e,n),this.stream.Zo(()=>{r(()=>this.listener.Zo())}),this.stream.Yo(()=>{r(()=>(this.state=2,this.v_=this.Ci.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.Yo()))}),this.stream.t_(i=>{r(()=>this.z_(i))}),this.stream.onMessage(i=>{r(()=>++this.F_==1?this.J_(i):this.onNext(i))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(e){return H(Kg,`close with error: ${e}`),this.stream=null,this.close(4,e)}Q_(e){return n=>{this.Ci.enqueueAndForget(()=>this.D_===e?n():(H(Kg,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class pR extends iw{constructor(e,n,r,i,s,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",n,r,i,o),this.serializer=s}j_(e,n){return this.connection.T_("Listen",e,n)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const n=EC(this.serializer,e),r=function(s){if(!("targetChange"in s))return te.min();const o=s.targetChange;return o.targetIds&&o.targetIds.length?te.min():o.readTime?hn(o.readTime):te.min()}(e);return this.listener.H_(n,r)}Z_(e){const n={};n.database=Jh(this.serializer),n.addTarget=function(s,o){let l;const u=o.target;if(l=Gh(u)?{documents:IC(s,u)}:{query:SC(s,u).ft},l.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){l.resumeToken=HE(s,o.resumeToken);const h=Qh(s,o.expectedCount);h!==null&&(l.expectedCount=h)}else if(o.snapshotVersion.compareTo(te.min())>0){l.readTime=Gl(s,o.snapshotVersion.toTimestamp());const h=Qh(s,o.expectedCount);h!==null&&(l.expectedCount=h)}return l}(this.serializer,e);const r=CC(this.serializer,e);r&&(n.labels=r),this.q_(n)}X_(e){const n={};n.database=Jh(this.serializer),n.removeTarget=e,this.q_(n)}}class mR extends iw{constructor(e,n,r,i,s,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",n,r,i,o),this.serializer=s}get Y_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}W_(){this.Y_&&this.ea([])}j_(e,n){return this.connection.T_("Write",e,n)}J_(e){return fe(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,fe(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){fe(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const n=TC(e.writeResults,e.commitTime),r=hn(e.commitTime);return this.listener.na(r,n)}ra(){const e={};e.database=Jh(this.serializer),this.q_(e)}ea(e){const n={streamToken:this.lastStreamToken,writes:e.map(r=>wC(this.serializer,r))};this.q_(n)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gR{}class yR extends gR{constructor(e,n,r,i){super(),this.authCredentials=e,this.appCheckCredentials=n,this.connection=r,this.serializer=i,this.ia=!1}sa(){if(this.ia)throw new K(U.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(e,n,r,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,o])=>this.connection.Wo(e,Yh(n,r),i,s,o)).catch(s=>{throw s.name==="FirebaseError"?(s.code===U.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),s):new K(U.UNKNOWN,s.toString())})}jo(e,n,r,i,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,l])=>this.connection.jo(e,Yh(n,r),i,o,l,s)).catch(o=>{throw o.name==="FirebaseError"?(o.code===U.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new K(U.UNKNOWN,o.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}function vR(t,e,n,r){return new yR(t,e,n,r)}class _R{constructor(e,n){this.asyncQueue=e,this.onlineStateHandler=n,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const n=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Vn(n),this.aa=!1):H("OnlineStateTracker",n)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const si="RemoteStore";class ER{constructor(e,n,r,i,s){this.localStore=e,this.datastore=n,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ea=new Map,this.Ia=new Set,this.Ra=[],this.Aa=s,this.Aa.Mo(o=>{r.enqueueAndForget(async()=>{hi(this)&&(H(si,"Restarting streams for network reachability change."),await async function(u){const h=ne(u);h.Ia.add(4),await ta(h),h.Va.set("Unknown"),h.Ia.delete(4),await xu(h)}(this))})}),this.Va=new _R(r,i)}}async function xu(t){if(hi(t))for(const e of t.Ra)await e(!0)}async function ta(t){for(const e of t.Ra)await e(!1)}function sw(t,e){const n=ne(t);n.Ea.has(e.targetId)||(n.Ea.set(e.targetId,e),Rf(n)?Cf(n):ms(n).O_()&&Af(n,e))}function Sf(t,e){const n=ne(t),r=ms(n);n.Ea.delete(e),r.O_()&&ow(n,e),n.Ea.size===0&&(r.O_()?r.L_():hi(n)&&n.Va.set("Unknown"))}function Af(t,e){if(t.da.$e(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(te.min())>0){const n=t.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(n)}ms(t).Z_(e)}function ow(t,e){t.da.$e(e),ms(t).X_(e)}function Cf(t){t.da=new fC({getRemoteKeysForTarget:e=>t.remoteSyncer.getRemoteKeysForTarget(e),At:e=>t.Ea.get(e)||null,ht:()=>t.datastore.serializer.databaseId}),ms(t).start(),t.Va.ua()}function Rf(t){return hi(t)&&!ms(t).x_()&&t.Ea.size>0}function hi(t){return ne(t).Ia.size===0}function aw(t){t.da=void 0}async function wR(t){t.Va.set("Online")}async function TR(t){t.Ea.forEach((e,n)=>{Af(t,e)})}async function IR(t,e){aw(t),Rf(t)?(t.Va.ha(e),Cf(t)):t.Va.set("Unknown")}async function SR(t,e,n){if(t.Va.set("Online"),e instanceof WE&&e.state===2&&e.cause)try{await async function(i,s){const o=s.cause;for(const l of s.targetIds)i.Ea.has(l)&&(await i.remoteSyncer.rejectListen(l,o),i.Ea.delete(l),i.da.removeTarget(l))}(t,e)}catch(r){H(si,"Failed to remove targets %s: %s ",e.targetIds.join(","),r),await Ql(t,r)}else if(e instanceof ll?t.da.Xe(e):e instanceof $E?t.da.st(e):t.da.tt(e),!n.isEqual(te.min()))try{const r=await nw(t.localStore);n.compareTo(r)>=0&&await function(s,o){const l=s.da.Tt(o);return l.targetChanges.forEach((u,h)=>{if(u.resumeToken.approximateByteSize()>0){const p=s.Ea.get(h);p&&s.Ea.set(h,p.withResumeToken(u.resumeToken,o))}}),l.targetMismatches.forEach((u,h)=>{const p=s.Ea.get(u);if(!p)return;s.Ea.set(u,p.withResumeToken(Ze.EMPTY_BYTE_STRING,p.snapshotVersion)),ow(s,u);const m=new sr(p.target,u,h,p.sequenceNumber);Af(s,m)}),s.remoteSyncer.applyRemoteEvent(l)}(t,n)}catch(r){H(si,"Failed to raise snapshot:",r),await Ql(t,r)}}async function Ql(t,e,n){if(!ps(e))throw e;t.Ia.add(1),await ta(t),t.Va.set("Offline"),n||(n=()=>nw(t.localStore)),t.asyncQueue.enqueueRetryable(async()=>{H(si,"Retrying IndexedDB access"),await n(),t.Ia.delete(1),await xu(t)})}function lw(t,e){return e().catch(n=>Ql(t,n,e))}async function bu(t){const e=ne(t),n=Cr(e);let r=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:uf;for(;AR(e);)try{const i=await sR(e.localStore,r);if(i===null){e.Ta.length===0&&n.L_();break}r=i.batchId,CR(e,i)}catch(i){await Ql(e,i)}uw(e)&&cw(e)}function AR(t){return hi(t)&&t.Ta.length<10}function CR(t,e){t.Ta.push(e);const n=Cr(t);n.O_()&&n.Y_&&n.ea(e.mutations)}function uw(t){return hi(t)&&!Cr(t).x_()&&t.Ta.length>0}function cw(t){Cr(t).start()}async function RR(t){Cr(t).ra()}async function kR(t){const e=Cr(t);for(const n of t.Ta)e.ea(n.mutations)}async function PR(t,e,n){const r=t.Ta.shift(),i=yf.from(r,e,n);await lw(t,()=>t.remoteSyncer.applySuccessfulWrite(i)),await bu(t)}async function NR(t,e){e&&Cr(t).Y_&&await async function(r,i){if(function(o){return cC(o)&&o!==U.ABORTED}(i.code)){const s=r.Ta.shift();Cr(r).B_(),await lw(r,()=>r.remoteSyncer.rejectFailedWrite(s.batchId,i)),await bu(r)}}(t,e),uw(t)&&cw(t)}async function Qg(t,e){const n=ne(t);n.asyncQueue.verifyOperationInProgress(),H(si,"RemoteStore received new credentials");const r=hi(n);n.Ia.add(3),await ta(n),r&&n.Va.set("Unknown"),await n.remoteSyncer.handleCredentialChange(e),n.Ia.delete(3),await xu(n)}async function xR(t,e){const n=ne(t);e?(n.Ia.delete(2),await xu(n)):e||(n.Ia.add(2),await ta(n),n.Va.set("Unknown"))}function ms(t){return t.ma||(t.ma=function(n,r,i){const s=ne(n);return s.sa(),new pR(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(t.datastore,t.asyncQueue,{Zo:wR.bind(null,t),Yo:TR.bind(null,t),t_:IR.bind(null,t),H_:SR.bind(null,t)}),t.Ra.push(async e=>{e?(t.ma.B_(),Rf(t)?Cf(t):t.Va.set("Unknown")):(await t.ma.stop(),aw(t))})),t.ma}function Cr(t){return t.fa||(t.fa=function(n,r,i){const s=ne(n);return s.sa(),new mR(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(t.datastore,t.asyncQueue,{Zo:()=>Promise.resolve(),Yo:RR.bind(null,t),t_:NR.bind(null,t),ta:kR.bind(null,t),na:PR.bind(null,t)}),t.Ra.push(async e=>{e?(t.fa.B_(),await bu(t)):(await t.fa.stop(),t.Ta.length>0&&(H(si,`Stopping write stream with ${t.Ta.length} pending writes`),t.Ta=[]))})),t.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kf{constructor(e,n,r,i,s){this.asyncQueue=e,this.timerId=n,this.targetTimeMs=r,this.op=i,this.removalCallback=s,this.deferred=new Cn,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(o=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,n,r,i,s){const o=Date.now()+r,l=new kf(e,n,o,i,s);return l.start(r),l}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new K(U.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function Pf(t,e){if(Vn("AsyncQueue",`${e}: ${t}`),ps(t))return new K(U.UNAVAILABLE,`${e}: ${t}`);throw t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ji{static emptySet(e){return new ji(e.comparator)}constructor(e){this.comparator=e?(n,r)=>e(n,r)||Y.comparator(n.key,r.key):(n,r)=>Y.comparator(n.key,r.key),this.keyedMap=Zs(),this.sortedSet=new Pe(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const n=this.keyedMap.get(e);return n?this.sortedSet.indexOf(n):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((n,r)=>(e(n),!1))}add(e){const n=this.delete(e.key);return n.copy(n.keyedMap.insert(e.key,e),n.sortedSet.insert(e,null))}delete(e){const n=this.get(e);return n?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(n)):this}isEqual(e){if(!(e instanceof ji)||this.size!==e.size)return!1;const n=this.sortedSet.getIterator(),r=e.sortedSet.getIterator();for(;n.hasNext();){const i=n.getNext().key,s=r.getNext().key;if(!i.isEqual(s))return!1}return!0}toString(){const e=[];return this.forEach(n=>{e.push(n.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,n){const r=new ji;return r.comparator=this.comparator,r.keyedMap=e,r.sortedSet=n,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yg{constructor(){this.ga=new Pe(Y.comparator)}track(e){const n=e.doc.key,r=this.ga.get(n);r?e.type!==0&&r.type===3?this.ga=this.ga.insert(n,e):e.type===3&&r.type!==1?this.ga=this.ga.insert(n,{type:r.type,doc:e.doc}):e.type===2&&r.type===2?this.ga=this.ga.insert(n,{type:2,doc:e.doc}):e.type===2&&r.type===0?this.ga=this.ga.insert(n,{type:0,doc:e.doc}):e.type===1&&r.type===0?this.ga=this.ga.remove(n):e.type===1&&r.type===2?this.ga=this.ga.insert(n,{type:1,doc:r.doc}):e.type===0&&r.type===1?this.ga=this.ga.insert(n,{type:2,doc:e.doc}):ee(63341,{Vt:e,pa:r}):this.ga=this.ga.insert(n,e)}ya(){const e=[];return this.ga.inorderTraversal((n,r)=>{e.push(r)}),e}}class ss{constructor(e,n,r,i,s,o,l,u,h){this.query=e,this.docs=n,this.oldDocs=r,this.docChanges=i,this.mutatedKeys=s,this.fromCache=o,this.syncStateChanged=l,this.excludesMetadataChanges=u,this.hasCachedResults=h}static fromInitialDocuments(e,n,r,i,s){const o=[];return n.forEach(l=>{o.push({type:0,doc:l})}),new ss(e,n,ji.emptySet(n),o,r,i,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Au(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const n=this.docChanges,r=e.docChanges;if(n.length!==r.length)return!1;for(let i=0;i<n.length;i++)if(n[i].type!==r[i].type||!n[i].doc.isEqual(r[i].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bR{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(e=>e.Da())}}class DR{constructor(){this.queries=Xg(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(n,r){const i=ne(n),s=i.queries;i.queries=Xg(),s.forEach((o,l)=>{for(const u of l.Sa)u.onError(r)})})(this,new K(U.ABORTED,"Firestore shutting down"))}}function Xg(){return new ci(t=>NE(t),Au)}async function hw(t,e){const n=ne(t);let r=3;const i=e.query;let s=n.queries.get(i);s?!s.ba()&&e.Da()&&(r=2):(s=new bR,r=e.Da()?0:1);try{switch(r){case 0:s.wa=await n.onListen(i,!0);break;case 1:s.wa=await n.onListen(i,!1);break;case 2:await n.onFirstRemoteStoreListen(i)}}catch(o){const l=Pf(o,`Initialization of query '${vi(e.query)}' failed`);return void e.onError(l)}n.queries.set(i,s),s.Sa.push(e),e.va(n.onlineState),s.wa&&e.Fa(s.wa)&&Nf(n)}async function dw(t,e){const n=ne(t),r=e.query;let i=3;const s=n.queries.get(r);if(s){const o=s.Sa.indexOf(e);o>=0&&(s.Sa.splice(o,1),s.Sa.length===0?i=e.Da()?0:1:!s.ba()&&e.Da()&&(i=2))}switch(i){case 0:return n.queries.delete(r),n.onUnlisten(r,!0);case 1:return n.queries.delete(r),n.onUnlisten(r,!1);case 2:return n.onLastRemoteStoreUnlisten(r);default:return}}function VR(t,e){const n=ne(t);let r=!1;for(const i of e){const s=i.query,o=n.queries.get(s);if(o){for(const l of o.Sa)l.Fa(i)&&(r=!0);o.wa=i}}r&&Nf(n)}function OR(t,e,n){const r=ne(t),i=r.queries.get(e);if(i)for(const s of i.Sa)s.onError(n);r.queries.delete(e)}function Nf(t){t.Ca.forEach(e=>{e.next()})}var td,Jg;(Jg=td||(td={})).Ma="default",Jg.Cache="cache";class fw{constructor(e,n,r){this.query=e,this.xa=n,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(e){if(!this.options.includeMetadataChanges){const r=[];for(const i of e.docChanges)i.type!==3&&r.push(i);e=new ss(e.query,e.docs,e.oldDocs,r,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let n=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),n=!0):this.La(e,this.onlineState)&&(this.ka(e),n=!0),this.Na=e,n}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let n=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),n=!0),n}La(e,n){if(!e.fromCache||!this.Da())return!0;const r=n!=="Offline";return(!this.options.qa||!r)&&(!e.docs.isEmpty()||e.hasCachedResults||n==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const n=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!n)&&this.options.includeMetadataChanges===!0}ka(e){e=ss.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==td.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pw{constructor(e){this.key=e}}class mw{constructor(e){this.key=e}}class LR{constructor(e,n){this.query=e,this.Za=n,this.Xa=null,this.hasCachedResults=!1,this.current=!1,this.Ya=ce(),this.mutatedKeys=ce(),this.eu=xE(e),this.tu=new ji(this.eu)}get nu(){return this.Za}ru(e,n){const r=n?n.iu:new Yg,i=n?n.tu:this.tu;let s=n?n.mutatedKeys:this.mutatedKeys,o=i,l=!1;const u=this.query.limitType==="F"&&i.size===this.query.limit?i.last():null,h=this.query.limitType==="L"&&i.size===this.query.limit?i.first():null;if(e.inorderTraversal((p,m)=>{const g=i.get(p),_=Cu(this.query,m)?m:null,N=!!g&&this.mutatedKeys.has(g.key),R=!!_&&(_.hasLocalMutations||this.mutatedKeys.has(_.key)&&_.hasCommittedMutations);let k=!1;g&&_?g.data.isEqual(_.data)?N!==R&&(r.track({type:3,doc:_}),k=!0):this.su(g,_)||(r.track({type:2,doc:_}),k=!0,(u&&this.eu(_,u)>0||h&&this.eu(_,h)<0)&&(l=!0)):!g&&_?(r.track({type:0,doc:_}),k=!0):g&&!_&&(r.track({type:1,doc:g}),k=!0,(u||h)&&(l=!0)),k&&(_?(o=o.add(_),s=R?s.add(p):s.delete(p)):(o=o.delete(p),s=s.delete(p)))}),this.query.limit!==null)for(;o.size>this.query.limit;){const p=this.query.limitType==="F"?o.last():o.first();o=o.delete(p.key),s=s.delete(p.key),r.track({type:1,doc:p})}return{tu:o,iu:r,bs:l,mutatedKeys:s}}su(e,n){return e.hasLocalMutations&&n.hasCommittedMutations&&!n.hasLocalMutations}applyChanges(e,n,r,i){const s=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort((p,m)=>function(_,N){const R=k=>{switch(k){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return ee(20277,{Vt:k})}};return R(_)-R(N)}(p.type,m.type)||this.eu(p.doc,m.doc)),this.ou(r),i=i??!1;const l=n&&!i?this._u():[],u=this.Ya.size===0&&this.current&&!i?1:0,h=u!==this.Xa;return this.Xa=u,o.length!==0||h?{snapshot:new ss(this.query,e.tu,s,o,e.mutatedKeys,u===0,h,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:l}:{au:l}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Yg,mutatedKeys:this.mutatedKeys,bs:!1},!1)):{au:[]}}uu(e){return!this.Za.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach(n=>this.Za=this.Za.add(n)),e.modifiedDocuments.forEach(n=>{}),e.removedDocuments.forEach(n=>this.Za=this.Za.delete(n)),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Ya;this.Ya=ce(),this.tu.forEach(r=>{this.uu(r.key)&&(this.Ya=this.Ya.add(r.key))});const n=[];return e.forEach(r=>{this.Ya.has(r)||n.push(new mw(r))}),this.Ya.forEach(r=>{e.has(r)||n.push(new pw(r))}),n}cu(e){this.Za=e.ks,this.Ya=ce();const n=this.ru(e.documents);return this.applyChanges(n,!0)}lu(){return ss.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Xa===0,this.hasCachedResults)}}const xf="SyncEngine";class MR{constructor(e,n,r){this.query=e,this.targetId=n,this.view=r}}class FR{constructor(e){this.key=e,this.hu=!1}}class UR{constructor(e,n,r,i,s,o){this.localStore=e,this.remoteStore=n,this.eventManager=r,this.sharedClientState=i,this.currentUser=s,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new ci(l=>NE(l),Au),this.Eu=new Map,this.Iu=new Set,this.Ru=new Pe(Y.comparator),this.Au=new Map,this.Vu=new Ef,this.du={},this.mu=new Map,this.fu=is.ar(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function zR(t,e,n=!0){const r=ww(t);let i;const s=r.Tu.get(e);return s?(r.sharedClientState.addLocalQueryTarget(s.targetId),i=s.view.lu()):i=await gw(r,e,n,!0),i}async function BR(t,e){const n=ww(t);await gw(n,e,!0,!1)}async function gw(t,e,n,r){const i=await oR(t.localStore,cn(e)),s=i.targetId,o=t.sharedClientState.addLocalQueryTarget(s,n);let l;return r&&(l=await jR(t,e,s,o==="current",i.resumeToken)),t.isPrimaryClient&&n&&sw(t.remoteStore,i),l}async function jR(t,e,n,r,i){t.pu=(m,g,_)=>async function(R,k,I,T){let P=k.view.ru(I);P.bs&&(P=await Wg(R.localStore,k.query,!1).then(({documents:w})=>k.view.ru(w,P)));const b=T&&T.targetChanges.get(k.targetId),V=T&&T.targetMismatches.get(k.targetId)!=null,M=k.view.applyChanges(P,R.isPrimaryClient,b,V);return ey(R,k.targetId,M.au),M.snapshot}(t,m,g,_);const s=await Wg(t.localStore,e,!0),o=new LR(e,s.ks),l=o.ru(s.documents),u=ea.createSynthesizedTargetChangeForCurrentChange(n,r&&t.onlineState!=="Offline",i),h=o.applyChanges(l,t.isPrimaryClient,u);ey(t,n,h.au);const p=new MR(e,n,o);return t.Tu.set(e,p),t.Eu.has(n)?t.Eu.get(n).push(e):t.Eu.set(n,[e]),h.snapshot}async function $R(t,e,n){const r=ne(t),i=r.Tu.get(e),s=r.Eu.get(i.targetId);if(s.length>1)return r.Eu.set(i.targetId,s.filter(o=>!Au(o,e))),void r.Tu.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(i.targetId),r.sharedClientState.isActiveQueryTarget(i.targetId)||await Zh(r.localStore,i.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(i.targetId),n&&Sf(r.remoteStore,i.targetId),nd(r,i.targetId)}).catch(fs)):(nd(r,i.targetId),await Zh(r.localStore,i.targetId,!0))}async function WR(t,e){const n=ne(t),r=n.Tu.get(e),i=n.Eu.get(r.targetId);n.isPrimaryClient&&i.length===1&&(n.sharedClientState.removeLocalQueryTarget(r.targetId),Sf(n.remoteStore,r.targetId))}async function HR(t,e,n){const r=JR(t);try{const i=await function(o,l){const u=ne(o),h=Te.now(),p=l.reduce((_,N)=>_.add(N.key),ce());let m,g;return u.persistence.runTransaction("Locally write mutations","readwrite",_=>{let N=On(),R=ce();return u.xs.getEntries(_,p).next(k=>{N=k,N.forEach((I,T)=>{T.isValidDocument()||(R=R.add(I))})}).next(()=>u.localDocuments.getOverlayedDocuments(_,N)).next(k=>{m=k;const I=[];for(const T of l){const P=sC(T,m.get(T.key).overlayedDocument);P!=null&&I.push(new Dr(T.key,P,IE(P.value.mapValue),Xt.exists(!0)))}return u.mutationQueue.addMutationBatch(_,h,I,l)}).next(k=>{g=k;const I=k.applyToLocalDocumentSet(m,R);return u.documentOverlayCache.saveOverlays(_,k.batchId,I)})}).then(()=>({batchId:g.batchId,changes:DE(m)}))}(r.localStore,e);r.sharedClientState.addPendingMutation(i.batchId),function(o,l,u){let h=o.du[o.currentUser.toKey()];h||(h=new Pe(ue)),h=h.insert(l,u),o.du[o.currentUser.toKey()]=h}(r,i.batchId,n),await na(r,i.changes),await bu(r.remoteStore)}catch(i){const s=Pf(i,"Failed to persist write");n.reject(s)}}async function yw(t,e){const n=ne(t);try{const r=await rR(n.localStore,e);e.targetChanges.forEach((i,s)=>{const o=n.Au.get(s);o&&(fe(i.addedDocuments.size+i.modifiedDocuments.size+i.removedDocuments.size<=1,22616),i.addedDocuments.size>0?o.hu=!0:i.modifiedDocuments.size>0?fe(o.hu,14607):i.removedDocuments.size>0&&(fe(o.hu,42227),o.hu=!1))}),await na(n,r,e)}catch(r){await fs(r)}}function Zg(t,e,n){const r=ne(t);if(r.isPrimaryClient&&n===0||!r.isPrimaryClient&&n===1){const i=[];r.Tu.forEach((s,o)=>{const l=o.view.va(e);l.snapshot&&i.push(l.snapshot)}),function(o,l){const u=ne(o);u.onlineState=l;let h=!1;u.queries.forEach((p,m)=>{for(const g of m.Sa)g.va(l)&&(h=!0)}),h&&Nf(u)}(r.eventManager,e),i.length&&r.Pu.H_(i),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}async function qR(t,e,n){const r=ne(t);r.sharedClientState.updateQueryState(e,"rejected",n);const i=r.Au.get(e),s=i&&i.key;if(s){let o=new Pe(Y.comparator);o=o.insert(s,lt.newNoDocument(s,te.min()));const l=ce().add(s),u=new Pu(te.min(),new Map,new Pe(ue),o,l);await yw(r,u),r.Ru=r.Ru.remove(s),r.Au.delete(e),bf(r)}else await Zh(r.localStore,e,!1).then(()=>nd(r,e,n)).catch(fs)}async function GR(t,e){const n=ne(t),r=e.batch.batchId;try{const i=await nR(n.localStore,e);_w(n,r,null),vw(n,r),n.sharedClientState.updateMutationState(r,"acknowledged"),await na(n,i)}catch(i){await fs(i)}}async function KR(t,e,n){const r=ne(t);try{const i=await function(o,l){const u=ne(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",h=>{let p;return u.mutationQueue.lookupMutationBatch(h,l).next(m=>(fe(m!==null,37113),p=m.keys(),u.mutationQueue.removeMutationBatch(h,m))).next(()=>u.mutationQueue.performConsistencyCheck(h)).next(()=>u.documentOverlayCache.removeOverlaysForBatchId(h,p,l)).next(()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(h,p)).next(()=>u.localDocuments.getDocuments(h,p))})}(r.localStore,e);_w(r,e,n),vw(r,e),r.sharedClientState.updateMutationState(e,"rejected",n),await na(r,i)}catch(i){await fs(i)}}function vw(t,e){(t.mu.get(e)||[]).forEach(n=>{n.resolve()}),t.mu.delete(e)}function _w(t,e,n){const r=ne(t);let i=r.du[r.currentUser.toKey()];if(i){const s=i.get(e);s&&(n?s.reject(n):s.resolve(),i=i.remove(e)),r.du[r.currentUser.toKey()]=i}}function nd(t,e,n=null){t.sharedClientState.removeLocalQueryTarget(e);for(const r of t.Eu.get(e))t.Tu.delete(r),n&&t.Pu.yu(r,n);t.Eu.delete(e),t.isPrimaryClient&&t.Vu.Gr(e).forEach(r=>{t.Vu.containsKey(r)||Ew(t,r)})}function Ew(t,e){t.Iu.delete(e.path.canonicalString());const n=t.Ru.get(e);n!==null&&(Sf(t.remoteStore,n),t.Ru=t.Ru.remove(e),t.Au.delete(n),bf(t))}function ey(t,e,n){for(const r of n)r instanceof pw?(t.Vu.addReference(r.key,e),QR(t,r)):r instanceof mw?(H(xf,"Document no longer in limbo: "+r.key),t.Vu.removeReference(r.key,e),t.Vu.containsKey(r.key)||Ew(t,r.key)):ee(19791,{wu:r})}function QR(t,e){const n=e.key,r=n.path.canonicalString();t.Ru.get(n)||t.Iu.has(r)||(H(xf,"New document in limbo: "+n),t.Iu.add(r),bf(t))}function bf(t){for(;t.Iu.size>0&&t.Ru.size<t.maxConcurrentLimboResolutions;){const e=t.Iu.values().next().value;t.Iu.delete(e);const n=new Y(we.fromString(e)),r=t.fu.next();t.Au.set(r,new FR(n)),t.Ru=t.Ru.insert(n,r),sw(t.remoteStore,new sr(cn(pf(n.path)),r,"TargetPurposeLimboResolution",wu.ce))}}async function na(t,e,n){const r=ne(t),i=[],s=[],o=[];r.Tu.isEmpty()||(r.Tu.forEach((l,u)=>{o.push(r.pu(u,e,n).then(h=>{var p;if((h||n)&&r.isPrimaryClient){const m=h?!h.fromCache:(p=n==null?void 0:n.targetChanges.get(u.targetId))==null?void 0:p.current;r.sharedClientState.updateQueryState(u.targetId,m?"current":"not-current")}if(h){i.push(h);const m=Tf.Is(u.targetId,h);s.push(m)}}))}),await Promise.all(o),r.Pu.H_(i),await async function(u,h){const p=ne(u);try{await p.persistence.runTransaction("notifyLocalViewChanges","readwrite",m=>F.forEach(h,g=>F.forEach(g.Ts,_=>p.persistence.referenceDelegate.addReference(m,g.targetId,_)).next(()=>F.forEach(g.Es,_=>p.persistence.referenceDelegate.removeReference(m,g.targetId,_)))))}catch(m){if(!ps(m))throw m;H(If,"Failed to update sequence numbers: "+m)}for(const m of h){const g=m.targetId;if(!m.fromCache){const _=p.vs.get(g),N=_.snapshotVersion,R=_.withLastLimboFreeSnapshotVersion(N);p.vs=p.vs.insert(g,R)}}}(r.localStore,s))}async function YR(t,e){const n=ne(t);if(!n.currentUser.isEqual(e)){H(xf,"User change. New user:",e.toKey());const r=await tw(n.localStore,e);n.currentUser=e,function(s,o){s.mu.forEach(l=>{l.forEach(u=>{u.reject(new K(U.CANCELLED,o))})}),s.mu.clear()}(n,"'waitForPendingWrites' promise is rejected due to a user change."),n.sharedClientState.handleUserChange(e,r.removedBatchIds,r.addedBatchIds),await na(n,r.Ns)}}function XR(t,e){const n=ne(t),r=n.Au.get(e);if(r&&r.hu)return ce().add(r.key);{let i=ce();const s=n.Eu.get(e);if(!s)return i;for(const o of s){const l=n.Tu.get(o);i=i.unionWith(l.view.nu)}return i}}function ww(t){const e=ne(t);return e.remoteStore.remoteSyncer.applyRemoteEvent=yw.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=XR.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=qR.bind(null,e),e.Pu.H_=VR.bind(null,e.eventManager),e.Pu.yu=OR.bind(null,e.eventManager),e}function JR(t){const e=ne(t);return e.remoteStore.remoteSyncer.applySuccessfulWrite=GR.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=KR.bind(null,e),e}class Yl{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Nu(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,n){return null}Mu(e,n){return null}vu(e){return tR(this.persistence,new JC,e.initialUser,this.serializer)}Cu(e){return new ew(wf.Vi,this.serializer)}Du(e){return new lR}async terminate(){var e,n;(e=this.gcScheduler)==null||e.stop(),(n=this.indexBackfillerScheduler)==null||n.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Yl.provider={build:()=>new Yl};class ZR extends Yl{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,n){fe(this.persistence.referenceDelegate instanceof Kl,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new MC(r,e.asyncQueue,n)}Cu(e){const n=this.cacheSizeBytes!==void 0?_t.withCacheSize(this.cacheSizeBytes):_t.DEFAULT;return new ew(r=>Kl.Vi(r,n),this.serializer)}}class rd{async initialize(e,n){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(n),this.remoteStore=this.createRemoteStore(n),this.eventManager=this.createEventManager(n),this.syncEngine=this.createSyncEngine(n,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>Zg(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=YR.bind(null,this.syncEngine),await xR(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new DR}()}createDatastore(e){const n=Nu(e.databaseInfo.databaseId),r=fR(e.databaseInfo);return vR(e.authCredentials,e.appCheckCredentials,r,n)}createRemoteStore(e){return function(r,i,s,o,l){return new ER(r,i,s,o,l)}(this.localStore,this.datastore,e.asyncQueue,n=>Zg(this.syncEngine,n,0),function(){return Gg.v()?new Gg:new uR}())}createSyncEngine(e,n){return function(i,s,o,l,u,h,p){const m=new UR(i,s,o,l,u,h);return p&&(m.gu=!0),m}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,n)}async terminate(){var e,n;await async function(i){const s=ne(i);H(si,"RemoteStore shutting down."),s.Ia.add(5),await ta(s),s.Aa.shutdown(),s.Va.set("Unknown")}(this.remoteStore),(e=this.datastore)==null||e.terminate(),(n=this.eventManager)==null||n.terminate()}}rd.provider={build:()=>new rd};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tw{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):Vn("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,n){setTimeout(()=>{this.muted||e(n)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rr="FirestoreClient";class ek{constructor(e,n,r,i,s){this.authCredentials=e,this.appCheckCredentials=n,this.asyncQueue=r,this._databaseInfo=i,this.user=ot.UNAUTHENTICATED,this.clientId=af.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=s,this.authCredentials.start(r,async o=>{H(Rr,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o}),this.appCheckCredentials.start(r,o=>(H(Rr,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Cn;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(n){const r=Pf(n,"Failed to shutdown persistence");e.reject(r)}}),e.promise}}async function jc(t,e){t.asyncQueue.verifyOperationInProgress(),H(Rr,"Initializing OfflineComponentProvider");const n=t.configuration;await e.initialize(n);let r=n.initialUser;t.setCredentialChangeListener(async i=>{r.isEqual(i)||(await tw(e.localStore,i),r=i)}),e.persistence.setDatabaseDeletedListener(()=>t.terminate()),t._offlineComponents=e}async function ty(t,e){t.asyncQueue.verifyOperationInProgress();const n=await tk(t);H(Rr,"Initializing OnlineComponentProvider"),await e.initialize(n,t.configuration),t.setCredentialChangeListener(r=>Qg(e.remoteStore,r)),t.setAppCheckTokenChangeListener((r,i)=>Qg(e.remoteStore,i)),t._onlineComponents=e}async function tk(t){if(!t._offlineComponents)if(t._uninitializedComponentsProvider){H(Rr,"Using user provided OfflineComponentProvider");try{await jc(t,t._uninitializedComponentsProvider._offline)}catch(e){const n=e;if(!function(i){return i.name==="FirebaseError"?i.code===U.FAILED_PRECONDITION||i.code===U.UNIMPLEMENTED:!(typeof DOMException<"u"&&i instanceof DOMException)||i.code===22||i.code===20||i.code===11}(n))throw n;ii("Error using user provided cache. Falling back to memory cache: "+n),await jc(t,new Yl)}}else H(Rr,"Using default OfflineComponentProvider"),await jc(t,new ZR(void 0));return t._offlineComponents}async function Iw(t){return t._onlineComponents||(t._uninitializedComponentsProvider?(H(Rr,"Using user provided OnlineComponentProvider"),await ty(t,t._uninitializedComponentsProvider._online)):(H(Rr,"Using default OnlineComponentProvider"),await ty(t,new rd))),t._onlineComponents}function nk(t){return Iw(t).then(e=>e.syncEngine)}async function Sw(t){const e=await Iw(t),n=e.eventManager;return n.onListen=zR.bind(null,e.syncEngine),n.onUnlisten=$R.bind(null,e.syncEngine),n.onFirstRemoteStoreListen=BR.bind(null,e.syncEngine),n.onLastRemoteStoreUnlisten=WR.bind(null,e.syncEngine),n}function rk(t,e,n={}){const r=new Cn;return t.asyncQueue.enqueueAndForget(async()=>function(s,o,l,u,h){const p=new Tw({next:g=>{p.Nu(),o.enqueueAndForget(()=>dw(s,m));const _=g.docs.has(l);!_&&g.fromCache?h.reject(new K(U.UNAVAILABLE,"Failed to get document because the client is offline.")):_&&g.fromCache&&u&&u.source==="server"?h.reject(new K(U.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):h.resolve(g)},error:g=>h.reject(g)}),m=new fw(pf(l.path),p,{includeMetadataChanges:!0,qa:!0});return hw(s,m)}(await Sw(t),t.asyncQueue,e,n,r)),r.promise}function ik(t,e,n={}){const r=new Cn;return t.asyncQueue.enqueueAndForget(async()=>function(s,o,l,u,h){const p=new Tw({next:g=>{p.Nu(),o.enqueueAndForget(()=>dw(s,m)),g.fromCache&&u.source==="server"?h.reject(new K(U.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):h.resolve(g)},error:g=>h.reject(g)}),m=new fw(l,p,{includeMetadataChanges:!0,qa:!0});return hw(s,m)}(await Sw(t),t.asyncQueue,e,n,r)),r.promise}function sk(t,e){const n=new Cn;return t.asyncQueue.enqueueAndForget(async()=>HR(await nk(t),e,n)),n.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Aw(t){const e={};return t.timeoutSeconds!==void 0&&(e.timeoutSeconds=t.timeoutSeconds),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ok="ComponentProvider",ny=new Map;function ak(t,e,n,r,i){return new RA(t,e,n,i.host,i.ssl,i.experimentalForceLongPolling,i.experimentalAutoDetectLongPolling,Aw(i.experimentalLongPollingOptions),i.useFetchStreams,i.isUsingEmulator,r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cw="firestore.googleapis.com",ry=!0;class iy{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new K(U.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Cw,this.ssl=ry}else this.host=e.host,this.ssl=e.ssl??ry;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=ZE;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<OC)throw new K(U.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}gA("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Aw(e.experimentalLongPollingOptions??{}),function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new K(U.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new K(U.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new K(U.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(r,i){return r.timeoutSeconds===i.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Du{constructor(e,n,r,i){this._authCredentials=e,this._appCheckCredentials=n,this._databaseId=r,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new iy({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new K(U.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new K(U.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new iy(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new oA;switch(r.type){case"firstParty":return new cA(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new K(U.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(n){const r=ny.get(n);r&&(H(ok,"Removing Datastore"),ny.delete(n),r.terminate())}(this),Promise.resolve()}}function lk(t,e,n,r={}){var h;t=mn(t,Du);const i=Xo(e),s=t._getSettings(),o={...s,emulatorOptions:t._getEmulatorOptions()},l=`${e}:${n}`;i&&X_(`https://${l}`),s.host!==Cw&&s.host!==l&&ii("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const u={...s,host:l,ssl:i,emulatorOptions:r};if(!ti(u,o)&&(t._setSettings(u),r.mockUserToken)){let p,m;if(typeof r.mockUserToken=="string")p=r.mockUserToken,m=ot.MOCK_USER;else{p=bS(r.mockUserToken,(h=t._app)==null?void 0:h.options.projectId);const g=r.mockUserToken.sub||r.mockUserToken.user_id;if(!g)throw new K(U.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");m=new ot(g)}t._authCredentials=new aA(new hE(p,m))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vu{constructor(e,n,r){this.converter=n,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Vu(this.firestore,e,this._query)}}class Me{constructor(e,n,r){this.converter=n,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new vr(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new Me(this.firestore,e,this._key)}toJSON(){return{type:Me._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,n,r){if(Jo(n,Me._jsonSchema))return new Me(e,r||null,new Y(we.fromString(n.referencePath)))}}Me._jsonSchemaVersion="firestore/documentReference/1.0",Me._jsonSchema={type:Le("string",Me._jsonSchemaVersion),referencePath:Le("string")};class vr extends Vu{constructor(e,n,r){super(e,n,pf(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new Me(this.firestore,null,new Y(e))}withConverter(e){return new vr(this.firestore,e,this._path)}}function uk(t,e,...n){if(t=Ge(t),dE("collection","path",e),t instanceof Du){const r=we.fromString(e,...n);return vg(r),new vr(t,null,r)}{if(!(t instanceof Me||t instanceof vr))throw new K(U.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=t._path.child(we.fromString(e,...n));return vg(r),new vr(t.firestore,null,r)}}function kr(t,e,...n){if(t=Ge(t),arguments.length===1&&(e=af.newId()),dE("doc","path",e),t instanceof Du){const r=we.fromString(e,...n);return yg(r),new Me(t,null,new Y(r))}{if(!(t instanceof Me||t instanceof vr))throw new K(U.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=t._path.child(we.fromString(e,...n));return yg(r),new Me(t.firestore,t instanceof vr?t.converter:null,new Y(r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sy="AsyncQueue";class oy{constructor(e=Promise.resolve()){this.Yu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new rw(this,"async_queue_retry"),this._c=()=>{const r=Bc();r&&H(sy,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=e;const n=Bc();n&&typeof n.addEventListener=="function"&&n.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const n=Bc();n&&typeof n.removeEventListener=="function"&&n.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise(()=>{});const n=new Cn;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(e().then(n.resolve,n.reject),n.promise)).then(()=>n.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Yu.push(e),this.lc()))}async lc(){if(this.Yu.length!==0){try{await this.Yu[0](),this.Yu.shift(),this.M_.reset()}catch(e){if(!ps(e))throw e;H(sy,"Operation failed with retryable error: "+e)}this.Yu.length>0&&this.M_.p_(()=>this.lc())}}cc(e){const n=this.ac.then(()=>(this.rc=!0,e().catch(r=>{throw this.nc=r,this.rc=!1,Vn("INTERNAL UNHANDLED ERROR: ",ay(r)),r}).then(r=>(this.rc=!1,r))));return this.ac=n,n}enqueueAfterDelay(e,n,r){this.uc(),this.oc.indexOf(e)>-1&&(n=0);const i=kf.createAndSchedule(this,e,n,r,s=>this.hc(s));return this.tc.push(i),i}uc(){this.nc&&ee(47125,{Pc:ay(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ec(e){for(const n of this.tc)if(n.timerId===e)return!0;return!1}Ic(e){return this.Tc().then(()=>{this.tc.sort((n,r)=>n.targetTimeMs-r.targetTimeMs);for(const n of this.tc)if(n.skipDelay(),e!=="all"&&n.timerId===e)break;return this.Tc()})}Rc(e){this.oc.push(e)}hc(e){const n=this.tc.indexOf(e);this.tc.splice(n,1)}}function ay(t){let e=t.message||"";return t.stack&&(e=t.stack.includes(t.message)?t.stack:t.message+`
`+t.stack),e}class gs extends Du{constructor(e,n,r,i){super(e,n,r,i),this.type="firestore",this._queue=new oy,this._persistenceKey=(i==null?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new oy(e),this._firestoreClient=void 0,await e}}}function ck(t,e){const n=typeof t=="object"?t:tE(),r=typeof t=="string"?t:Bl,i=sf(n,"firestore").getImmediate({identifier:r});if(!i._initialized){const s=NS("firestore");s&&lk(i,...s)}return i}function Df(t){if(t._terminated)throw new K(U.FAILED_PRECONDITION,"The client has already been terminated.");return t._firestoreClient||hk(t),t._firestoreClient}function hk(t){var r,i,s,o;const e=t._freezeSettings(),n=ak(t._databaseId,((r=t._app)==null?void 0:r.options.appId)||"",t._persistenceKey,(i=t._app)==null?void 0:i.options.apiKey,e);t._componentsProvider||(s=e.localCache)!=null&&s._offlineComponentProvider&&((o=e.localCache)!=null&&o._onlineComponentProvider)&&(t._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),t._firestoreClient=new ek(t._authCredentials,t._appCheckCredentials,t._queue,n,t._componentsProvider&&function(u){const h=u==null?void 0:u._online.build();return{_offline:u==null?void 0:u._offline.build(h),_online:h}}(t._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ft{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Ft(Ze.fromBase64String(e))}catch(n){throw new K(U.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+n)}}static fromUint8Array(e){return new Ft(Ze.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Ft._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Jo(e,Ft._jsonSchema))return Ft.fromBase64String(e.bytes)}}Ft._jsonSchemaVersion="firestore/bytes/1.0",Ft._jsonSchema={type:Le("string",Ft._jsonSchemaVersion),bytes:Le("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vf{constructor(...e){for(let n=0;n<e.length;++n)if(e[n].length===0)throw new K(U.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Ye(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Of{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dn{constructor(e,n){if(!isFinite(e)||e<-90||e>90)throw new K(U.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(n)||n<-180||n>180)throw new K(U.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+n);this._lat=e,this._long=n}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return ue(this._lat,e._lat)||ue(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:dn._jsonSchemaVersion}}static fromJSON(e){if(Jo(e,dn._jsonSchema))return new dn(e.latitude,e.longitude)}}dn._jsonSchemaVersion="firestore/geoPoint/1.0",dn._jsonSchema={type:Le("string",dn._jsonSchemaVersion),latitude:Le("number"),longitude:Le("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jt{constructor(e){this._values=(e||[]).map(n=>n)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(r,i){if(r.length!==i.length)return!1;for(let s=0;s<r.length;++s)if(r[s]!==i[s])return!1;return!0}(this._values,e._values)}toJSON(){return{type:Jt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Jo(e,Jt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(n=>typeof n=="number"))return new Jt(e.vectorValues);throw new K(U.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Jt._jsonSchemaVersion="firestore/vectorValue/1.0",Jt._jsonSchema={type:Le("string",Jt._jsonSchemaVersion),vectorValues:Le("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dk=/^__.*__$/;class fk{constructor(e,n,r){this.data=e,this.fieldMask=n,this.fieldTransforms=r}toMutation(e,n){return this.fieldMask!==null?new Dr(e,this.data,this.fieldMask,n,this.fieldTransforms):new Zo(e,this.data,n,this.fieldTransforms)}}class Rw{constructor(e,n,r){this.data=e,this.fieldMask=n,this.fieldTransforms=r}toMutation(e,n){return new Dr(e,this.data,this.fieldMask,n,this.fieldTransforms)}}function kw(t){switch(t){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw ee(40011,{dataSource:t})}}class Lf{constructor(e,n,r,i,s,o){this.settings=e,this.databaseId=n,this.serializer=r,this.ignoreUndefinedProperties=i,s===void 0&&this.Ac(),this.fieldTransforms=s||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}i(e){return new Lf({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}dc(e){var i;const n=(i=this.path)==null?void 0:i.child(e),r=this.i({path:n,arrayElement:!1});return r.mc(e),r}fc(e){var i;const n=(i=this.path)==null?void 0:i.child(e),r=this.i({path:n,arrayElement:!1});return r.Ac(),r}gc(e){return this.i({path:void 0,arrayElement:!0})}yc(e){return Xl(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find(n=>e.isPrefixOf(n))!==void 0||this.fieldTransforms.find(n=>e.isPrefixOf(n.field))!==void 0}Ac(){if(this.path)for(let e=0;e<this.path.length;e++)this.mc(this.path.get(e))}mc(e){if(e.length===0)throw this.yc("Document fields must not be empty");if(kw(this.dataSource)&&dk.test(e))throw this.yc('Document fields cannot begin and end with "__"')}}class pk{constructor(e,n,r){this.databaseId=e,this.ignoreUndefinedProperties=n,this.serializer=r||Nu(e)}A(e,n,r,i=!1){return new Lf({dataSource:e,methodName:n,targetDoc:r,path:Ye.emptyPath(),arrayElement:!1,hasConverter:i},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Pw(t){const e=t._freezeSettings(),n=Nu(t._databaseId);return new pk(t._databaseId,!!e.ignoreUndefinedProperties,n)}function mk(t,e,n,r,i,s={}){const o=t.A(s.merge||s.mergeFields?2:0,e,n,i);Mf("Data must be an object, but it was:",o,r);const l=Nw(r,o);let u,h;if(s.merge)u=new Pt(o.fieldMask),h=o.fieldTransforms;else if(s.mergeFields){const p=[];for(const m of s.mergeFields){const g=Bo(e,m,n);if(!o.contains(g))throw new K(U.INVALID_ARGUMENT,`Field '${g}' is specified in your field mask but missing from your input data.`);Dw(p,g)||p.push(g)}u=new Pt(p),h=o.fieldTransforms.filter(m=>u.covers(m.field))}else u=null,h=o.fieldTransforms;return new fk(new wt(l),u,h)}class Ou extends Of{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.yc(`${this._methodName}() can only appear at the top level of your update data`):e.yc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Ou}}function gk(t,e,n,r){const i=t.A(1,e,n);Mf("Data must be an object, but it was:",i,r);const s=[],o=wt.empty();br(r,(u,h)=>{const p=bw(e,u,n);h=Ge(h);const m=i.fc(p);if(h instanceof Ou)s.push(p);else{const g=Lu(h,m);g!=null&&(s.push(p),o.set(p,g))}});const l=new Pt(s);return new Rw(o,l,i.fieldTransforms)}function yk(t,e,n,r,i,s){const o=t.A(1,e,n),l=[Bo(e,r,n)],u=[i];if(s.length%2!=0)throw new K(U.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let g=0;g<s.length;g+=2)l.push(Bo(e,s[g])),u.push(s[g+1]);const h=[],p=wt.empty();for(let g=l.length-1;g>=0;--g)if(!Dw(h,l[g])){const _=l[g];let N=u[g];N=Ge(N);const R=o.fc(_);if(N instanceof Ou)h.push(_);else{const k=Lu(N,R);k!=null&&(h.push(_),p.set(_,k))}}const m=new Pt(h);return new Rw(p,m,o.fieldTransforms)}function Lu(t,e){if(xw(t=Ge(t)))return Mf("Unsupported field value:",e,t),Nw(t,e);if(t instanceof Of)return function(r,i){if(!kw(i.dataSource))throw i.yc(`${r._methodName}() can only be used with update() and set()`);if(!i.path)throw i.yc(`${r._methodName}() is not currently supported inside arrays`);const s=r._toFieldTransform(i);s&&i.fieldTransforms.push(s)}(t,e),null;if(t===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),t instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.yc("Nested arrays are not supported");return function(r,i){const s=[];let o=0;for(const l of r){let u=Lu(l,i.gc(o));u==null&&(u={nullValue:"NULL_VALUE"}),s.push(u),o++}return{arrayValue:{values:s}}}(t,e)}return function(r,i){if((r=Ge(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return ZA(i.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const s=Te.fromDate(r);return{timestampValue:Gl(i.serializer,s)}}if(r instanceof Te){const s=new Te(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:Gl(i.serializer,s)}}if(r instanceof dn)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof Ft)return{bytesValue:HE(i.serializer,r._byteString)};if(r instanceof Me){const s=i.databaseId,o=r.firestore._databaseId;if(!o.isEqual(s))throw i.yc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${s.projectId}/${s.database}`);return{referenceValue:_f(r.firestore._databaseId||i.databaseId,r._key.path)}}if(r instanceof Jt)return function(o,l){const u=o instanceof Jt?o.toArray():o;return{mapValue:{fields:{[wE]:{stringValue:TE},[jl]:{arrayValue:{values:u.map(p=>{if(typeof p!="number")throw l.yc("VectorValues must only contain numeric values.");return mf(l.serializer,p)})}}}}}}(r,i);if(JE(r))return r._toProto(i.serializer);throw i.yc(`Unsupported field value: ${lf(r)}`)}(t,e)}function Nw(t,e){const n={};return mE(t)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):br(t,(r,i)=>{const s=Lu(i,e.dc(r));s!=null&&(n[r]=s)}),{mapValue:{fields:n}}}function xw(t){return!(typeof t!="object"||t===null||t instanceof Array||t instanceof Date||t instanceof Te||t instanceof dn||t instanceof Ft||t instanceof Me||t instanceof Of||t instanceof Jt||JE(t))}function Mf(t,e,n){if(!xw(n)||!fE(n)){const r=lf(n);throw r==="an object"?e.yc(t+" a custom object"):e.yc(t+" "+r)}}function Bo(t,e,n){if((e=Ge(e))instanceof Vf)return e._internalPath;if(typeof e=="string")return bw(t,e);throw Xl("Field path arguments must be of type string or ",t,!1,void 0,n)}const vk=new RegExp("[~\\*/\\[\\]]");function bw(t,e,n){if(e.search(vk)>=0)throw Xl(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,t,!1,void 0,n);try{return new Vf(...e.split("."))._internalPath}catch{throw Xl(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,t,!1,void 0,n)}}function Xl(t,e,n,r,i){const s=r&&!r.isEmpty(),o=i!==void 0;let l=`Function ${e}() called with invalid data`;n&&(l+=" (via `toFirestore()`)"),l+=". ";let u="";return(s||o)&&(u+=" (found",s&&(u+=` in field ${r}`),o&&(u+=` in document ${i}`),u+=")"),new K(U.INVALID_ARGUMENT,l+t+u)}function Dw(t,e){return t.some(n=>n.isEqual(e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _k{convertValue(e,n="none"){switch(Ar(e)){case 0:return null;case 1:return e.booleanValue;case 2:return be(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,n);case 5:return e.stringValue;case 6:return this.convertBytes(Sr(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,n);case 11:return this.convertObject(e.mapValue,n);case 10:return this.convertVectorValue(e.mapValue);default:throw ee(62114,{value:e})}}convertObject(e,n){return this.convertObjectMap(e.fields,n)}convertObjectMap(e,n="none"){const r={};return br(e,(i,s)=>{r[i]=this.convertValue(s,n)}),r}convertVectorValue(e){var r,i,s;const n=(s=(i=(r=e.fields)==null?void 0:r[jl].arrayValue)==null?void 0:i.values)==null?void 0:s.map(o=>be(o.doubleValue));return new Jt(n)}convertGeoPoint(e){return new dn(be(e.latitude),be(e.longitude))}convertArray(e,n){return(e.values||[]).map(r=>this.convertValue(r,n))}convertServerTimestamp(e,n){switch(n){case"previous":const r=Iu(e);return r==null?null:this.convertValue(r,n);case"estimate":return this.convertTimestamp(Lo(e));default:return null}}convertTimestamp(e){const n=Ir(e);return new Te(n.seconds,n.nanos)}convertDocumentKey(e,n){const r=we.fromString(e);fe(XE(r),9688,{name:e});const i=new Mo(r.get(1),r.get(3)),s=new Y(r.popFirst(5));return i.isEqual(n)||Vn(`Document ${s} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${n.projectId}/${n.database}) instead.`),s}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vw extends _k{constructor(e){super(),this.firestore=e}convertBytes(e){return new Ft(e)}convertReference(e){const n=this.convertDocumentKey(e,this.firestore._databaseId);return new Me(this.firestore,null,n)}}const ly="@firebase/firestore",uy="4.13.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ow{constructor(e,n,r,i,s){this._firestore=e,this._userDataWriter=n,this._key=r,this._document=i,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new Me(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new Ek(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const n=this._document.data.field(Bo("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n)}}}class Ek extends Ow{data(){return super.data()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wk(t){if(t.limitType==="L"&&t.explicitOrderBy.length===0)throw new K(U.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}function Tk(t,e,n){let r;return r=t?t.toFirestore(e):e,r}class to{constructor(e,n){this.hasPendingWrites=e,this.fromCache=n}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Qr extends Ow{constructor(e,n,r,i,s,o){super(e,n,r,i,o),this._firestore=e,this._firestoreImpl=e,this.metadata=s}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const n=new ul(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(n,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,n={}){if(this._document){const r=this._document.data.field(Bo("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,n.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new K(U.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,n={};return n.type=Qr._jsonSchemaVersion,n.bundle="",n.bundleSource="DocumentSnapshot",n.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?n:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),n.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),n)}}Qr._jsonSchemaVersion="firestore/documentSnapshot/1.0",Qr._jsonSchema={type:Le("string",Qr._jsonSchemaVersion),bundleSource:Le("string","DocumentSnapshot"),bundleName:Le("string"),bundle:Le("string")};class ul extends Qr{data(e={}){return super.data(e)}}class $i{constructor(e,n,r,i){this._firestore=e,this._userDataWriter=n,this._snapshot=i,this.metadata=new to(i.hasPendingWrites,i.fromCache),this.query=r}get docs(){const e=[];return this.forEach(n=>e.push(n)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,n){this._snapshot.docs.forEach(r=>{e.call(n,new ul(this._firestore,this._userDataWriter,r.key,r,new to(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const n=!!e.includeMetadataChanges;if(n&&this._snapshot.excludesMetadataChanges)throw new K(U.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===n||(this._cachedChanges=function(i,s){if(i._snapshot.oldDocs.isEmpty()){let o=0;return i._snapshot.docChanges.map(l=>{const u=new ul(i._firestore,i._userDataWriter,l.doc.key,l.doc,new to(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);return l.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}})}{let o=i._snapshot.oldDocs;return i._snapshot.docChanges.filter(l=>s||l.type!==3).map(l=>{const u=new ul(i._firestore,i._userDataWriter,l.doc.key,l.doc,new to(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);let h=-1,p=-1;return l.type!==0&&(h=o.indexOf(l.doc.key),o=o.delete(l.doc.key)),l.type!==1&&(o=o.add(l.doc),p=o.indexOf(l.doc.key)),{type:Ik(l.type),doc:u,oldIndex:h,newIndex:p}})}}(this,n),this._cachedChangesIncludeMetadataChanges=n),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new K(U.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=$i._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=af.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const n=[],r=[],i=[];return this.docs.forEach(s=>{s._document!==null&&(n.push(s._document),r.push(this._userDataWriter.convertObjectMap(s._document.data.value.mapValue.fields,"previous")),i.push(s.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function Ik(t){switch(t){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return ee(61501,{type:t})}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */$i._jsonSchemaVersion="firestore/querySnapshot/1.0",$i._jsonSchema={type:Le("string",$i._jsonSchemaVersion),bundleSource:Le("string","QuerySnapshot"),bundleName:Le("string"),bundle:Le("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ff(t){t=mn(t,Me);const e=mn(t.firestore,gs),n=Df(e);return rk(n,t._key).then(r=>Ck(e,t,r))}function Sk(t){t=mn(t,Vu);const e=mn(t.firestore,gs),n=Df(e),r=new Vw(e);return wk(t._query),ik(n,t._query).then(i=>new $i(e,r,t,i))}function Lw(t,e,n){t=mn(t,Me);const r=mn(t.firestore,gs),i=Tk(t.converter,e),s=Pw(r);return Uf(r,[mk(s,"setDoc",t._key,i,t.converter!==null,n).toMutation(t._key,Xt.none())])}function Mw(t,e,n,...r){t=mn(t,Me);const i=mn(t.firestore,gs),s=Pw(i);let o;return o=typeof(e=Ge(e))=="string"||e instanceof Vf?yk(s,"updateDoc",t._key,e,n,r):gk(s,"updateDoc",t._key,e),Uf(i,[o.toMutation(t._key,Xt.exists(!0))])}function Ak(t){return Uf(mn(t.firestore,gs),[new gf(t._key,Xt.none())])}function Uf(t,e){const n=Df(t);return sk(n,e)}function Ck(t,e,n){const r=n.docs.get(e._key),i=new Vw(t);return new Qr(t,i,e._key,r,new to(n.hasPendingWrites,n.fromCache),e.converter)}(function(e,n=!0){sA(hs),es(new ni("firestore",(r,{instanceIdentifier:i,options:s})=>{const o=r.getProvider("app").getImmediate(),l=new gs(new lA(r.getProvider("auth-internal")),new hA(o,r.getProvider("app-check-internal")),kA(o,i),o);return s={useFetchStreams:n,...s},l._setSettings(s),l},"PUBLIC").setMultipleInstances(!0)),gr(ly,uy,e),gr(ly,uy,"esm2020")})();function Fw(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const Rk=Fw,Uw=new Qo("auth","Firebase",Fw());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jl=new nf("@firebase/auth");function kk(t,...e){Jl.logLevel<=le.WARN&&Jl.warn(`Auth (${hs}): ${t}`,...e)}function cl(t,...e){Jl.logLevel<=le.ERROR&&Jl.error(`Auth (${hs}): ${t}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function en(t,...e){throw zf(t,...e)}function fn(t,...e){return zf(t,...e)}function zw(t,e,n){const r={...Rk(),[e]:n};return new Qo("auth","Firebase",r).create(e,{appName:t.name})}function Rn(t){return zw(t,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function zf(t,...e){if(typeof t!="string"){const n=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=t.name),t._errorFactory.create(n,...r)}return Uw.create(t,...e)}function Z(t,e,...n){if(!t)throw zf(e,...n)}function Tn(t){const e="INTERNAL ASSERTION FAILED: "+t;throw cl(e),new Error(e)}function Ln(t,e){t||Tn(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function id(){var t;return typeof self<"u"&&((t=self.location)==null?void 0:t.href)||""}function Pk(){return cy()==="http:"||cy()==="https:"}function cy(){var t;return typeof self<"u"&&((t=self.location)==null?void 0:t.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nk(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Pk()||LS()||"connection"in navigator)?navigator.onLine:!0}function xk(){if(typeof navigator>"u")return null;const t=navigator;return t.languages&&t.languages[0]||t.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ra{constructor(e,n){this.shortDelay=e,this.longDelay=n,Ln(n>e,"Short delay should be less than long delay!"),this.isMobile=DS()||MS()}get(){return Nk()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bf(t,e){Ln(t.emulator,"Emulator should always be set here");const{url:n}=t.emulator;return e?`${n}${e.startsWith("/")?e.slice(1):e}`:n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bw{static initialize(e,n,r){this.fetchImpl=e,n&&(this.headersImpl=n),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Tn("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Tn("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Tn("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bk={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dk=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],Vk=new ra(3e4,6e4);function Un(t,e){return t.tenantId&&!e.tenantId?{...e,tenantId:t.tenantId}:e}async function zn(t,e,n,r,i={}){return jw(t,i,async()=>{let s={},o={};r&&(e==="GET"?o=r:s={body:JSON.stringify(r)});const l=Yo({key:t.config.apiKey,...o}).slice(1),u=await t._getAdditionalHeaders();u["Content-Type"]="application/json",t.languageCode&&(u["X-Firebase-Locale"]=t.languageCode);const h={method:e,headers:u,...s};return OS()||(h.referrerPolicy="no-referrer"),t.emulatorConfig&&Xo(t.emulatorConfig.host)&&(h.credentials="include"),Bw.fetch()(await $w(t,t.config.apiHost,n,l),h)})}async function jw(t,e,n){t._canInitEmulator=!1;const r={...bk,...e};try{const i=new Lk(t),s=await Promise.race([n(),i.promise]);i.clearNetworkTimeout();const o=await s.json();if("needConfirmation"in o)throw $a(t,"account-exists-with-different-credential",o);if(s.ok&&!("errorMessage"in o))return o;{const l=s.ok?o.errorMessage:o.error.message,[u,h]=l.split(" : ");if(u==="FEDERATED_USER_ID_ALREADY_LINKED")throw $a(t,"credential-already-in-use",o);if(u==="EMAIL_EXISTS")throw $a(t,"email-already-in-use",o);if(u==="USER_DISABLED")throw $a(t,"user-disabled",o);const p=r[u]||u.toLowerCase().replace(/[_\s]+/g,"-");if(h)throw zw(t,p,h);en(t,p)}}catch(i){if(i instanceof Fn)throw i;en(t,"network-request-failed",{message:String(i)})}}async function ia(t,e,n,r,i={}){const s=await zn(t,e,n,r,i);return"mfaPendingCredential"in s&&en(t,"multi-factor-auth-required",{_serverResponse:s}),s}async function $w(t,e,n,r){const i=`${e}${n}?${r}`,s=t,o=s.config.emulator?Bf(t.config,i):`${t.config.apiScheme}://${i}`;return Dk.includes(n)&&(await s._persistenceManagerAvailable,s._getPersistenceType()==="COOKIE")?s._getPersistence()._getFinalTarget(o).toString():o}function Ok(t){switch(t){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class Lk{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((n,r)=>{this.timer=setTimeout(()=>r(fn(this.auth,"network-request-failed")),Vk.get())})}}function $a(t,e,n){const r={appName:t.name};n.email&&(r.email=n.email),n.phoneNumber&&(r.phoneNumber=n.phoneNumber);const i=fn(t,e,r);return i.customData._tokenResponse=n,i}function hy(t){return t!==void 0&&t.enterprise!==void 0}class Mk{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const n of this.recaptchaEnforcementState)if(n.provider&&n.provider===e)return Ok(n.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}async function Fk(t,e){return zn(t,"GET","/v2/recaptchaConfig",Un(t,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Uk(t,e){return zn(t,"POST","/v1/accounts:delete",e)}async function Zl(t,e){return zn(t,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function go(t){if(t)try{const e=new Date(Number(t));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function zk(t,e=!1){const n=Ge(t),r=await n.getIdToken(e),i=jf(r);Z(i&&i.exp&&i.auth_time&&i.iat,n.auth,"internal-error");const s=typeof i.firebase=="object"?i.firebase:void 0,o=s==null?void 0:s.sign_in_provider;return{claims:i,token:r,authTime:go($c(i.auth_time)),issuedAtTime:go($c(i.iat)),expirationTime:go($c(i.exp)),signInProvider:o||null,signInSecondFactor:(s==null?void 0:s.sign_in_second_factor)||null}}function $c(t){return Number(t)*1e3}function jf(t){const[e,n,r]=t.split(".");if(e===void 0||n===void 0||r===void 0)return cl("JWT malformed, contained fewer than 3 sections"),null;try{const i=G_(n);return i?JSON.parse(i):(cl("Failed to decode base64 JWT payload"),null)}catch(i){return cl("Caught error parsing JWT payload as JSON",i==null?void 0:i.toString()),null}}function dy(t){const e=jf(t);return Z(e,"internal-error"),Z(typeof e.exp<"u","internal-error"),Z(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function jo(t,e,n=!1){if(n)return e;try{return await e}catch(r){throw r instanceof Fn&&Bk(r)&&t.auth.currentUser===t&&await t.auth.signOut(),r}}function Bk({code:t}){return t==="auth/user-disabled"||t==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jk{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const n=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),n}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const n=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},n)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sd{constructor(e,n){this.createdAt=e,this.lastLoginAt=n,this._initializeTime()}_initializeTime(){this.lastSignInTime=go(this.lastLoginAt),this.creationTime=go(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eu(t){var m;const e=t.auth,n=await t.getIdToken(),r=await jo(t,Zl(e,{idToken:n}));Z(r==null?void 0:r.users.length,e,"internal-error");const i=r.users[0];t._notifyReloadListener(i);const s=(m=i.providerUserInfo)!=null&&m.length?Ww(i.providerUserInfo):[],o=Wk(t.providerData,s),l=t.isAnonymous,u=!(t.email&&i.passwordHash)&&!(o!=null&&o.length),h=l?u:!1,p={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:o,metadata:new sd(i.createdAt,i.lastLoginAt),isAnonymous:h};Object.assign(t,p)}async function $k(t){const e=Ge(t);await eu(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function Wk(t,e){return[...t.filter(r=>!e.some(i=>i.providerId===r.providerId)),...e]}function Ww(t){return t.map(({providerId:e,...n})=>({providerId:e,uid:n.rawId||"",displayName:n.displayName||null,email:n.email||null,phoneNumber:n.phoneNumber||null,photoURL:n.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hk(t,e){const n=await jw(t,{},async()=>{const r=Yo({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:i,apiKey:s}=t.config,o=await $w(t,i,"/v1/token",`key=${s}`),l=await t._getAdditionalHeaders();l["Content-Type"]="application/x-www-form-urlencoded";const u={method:"POST",headers:l,body:r};return t.emulatorConfig&&Xo(t.emulatorConfig.host)&&(u.credentials="include"),Bw.fetch()(o,u)});return{accessToken:n.access_token,expiresIn:n.expires_in,refreshToken:n.refresh_token}}async function qk(t,e){return zn(t,"POST","/v2/accounts:revokeToken",Un(t,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wi{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){Z(e.idToken,"internal-error"),Z(typeof e.idToken<"u","internal-error"),Z(typeof e.refreshToken<"u","internal-error");const n="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):dy(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,n)}updateFromIdToken(e){Z(e.length!==0,"internal-error");const n=dy(e);this.updateTokensAndExpiration(e,null,n)}async getToken(e,n=!1){return!n&&this.accessToken&&!this.isExpired?this.accessToken:(Z(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,n){const{accessToken:r,refreshToken:i,expiresIn:s}=await Hk(e,n);this.updateTokensAndExpiration(r,i,Number(s))}updateTokensAndExpiration(e,n,r){this.refreshToken=n||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,n){const{refreshToken:r,accessToken:i,expirationTime:s}=n,o=new Wi;return r&&(Z(typeof r=="string","internal-error",{appName:e}),o.refreshToken=r),i&&(Z(typeof i=="string","internal-error",{appName:e}),o.accessToken=i),s&&(Z(typeof s=="number","internal-error",{appName:e}),o.expirationTime=s),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Wi,this.toJSON())}_performRefresh(){return Tn("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kn(t,e){Z(typeof t=="string"||typeof t>"u","internal-error",{appName:e})}class Kt{constructor({uid:e,auth:n,stsTokenManager:r,...i}){this.providerId="firebase",this.proactiveRefresh=new jk(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=n,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=i.displayName||null,this.email=i.email||null,this.emailVerified=i.emailVerified||!1,this.phoneNumber=i.phoneNumber||null,this.photoURL=i.photoURL||null,this.isAnonymous=i.isAnonymous||!1,this.tenantId=i.tenantId||null,this.providerData=i.providerData?[...i.providerData]:[],this.metadata=new sd(i.createdAt||void 0,i.lastLoginAt||void 0)}async getIdToken(e){const n=await jo(this,this.stsTokenManager.getToken(this.auth,e));return Z(n,this.auth,"internal-error"),this.accessToken!==n&&(this.accessToken=n,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),n}getIdTokenResult(e){return zk(this,e)}reload(){return $k(this)}_assign(e){this!==e&&(Z(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(n=>({...n})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const n=new Kt({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return n.metadata._copy(this.metadata),n}_onReload(e){Z(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,n=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),n&&await eu(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Mt(this.auth.app))return Promise.reject(Rn(this.auth));const e=await this.getIdToken();return await jo(this,Uk(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,n){const r=n.displayName??void 0,i=n.email??void 0,s=n.phoneNumber??void 0,o=n.photoURL??void 0,l=n.tenantId??void 0,u=n._redirectEventId??void 0,h=n.createdAt??void 0,p=n.lastLoginAt??void 0,{uid:m,emailVerified:g,isAnonymous:_,providerData:N,stsTokenManager:R}=n;Z(m&&R,e,"internal-error");const k=Wi.fromJSON(this.name,R);Z(typeof m=="string",e,"internal-error"),Kn(r,e.name),Kn(i,e.name),Z(typeof g=="boolean",e,"internal-error"),Z(typeof _=="boolean",e,"internal-error"),Kn(s,e.name),Kn(o,e.name),Kn(l,e.name),Kn(u,e.name),Kn(h,e.name),Kn(p,e.name);const I=new Kt({uid:m,auth:e,email:i,emailVerified:g,displayName:r,isAnonymous:_,photoURL:o,phoneNumber:s,tenantId:l,stsTokenManager:k,createdAt:h,lastLoginAt:p});return N&&Array.isArray(N)&&(I.providerData=N.map(T=>({...T}))),u&&(I._redirectEventId=u),I}static async _fromIdTokenResponse(e,n,r=!1){const i=new Wi;i.updateFromServerResponse(n);const s=new Kt({uid:n.localId,auth:e,stsTokenManager:i,isAnonymous:r});return await eu(s),s}static async _fromGetAccountInfoResponse(e,n,r){const i=n.users[0];Z(i.localId!==void 0,"internal-error");const s=i.providerUserInfo!==void 0?Ww(i.providerUserInfo):[],o=!(i.email&&i.passwordHash)&&!(s!=null&&s.length),l=new Wi;l.updateFromIdToken(r);const u=new Kt({uid:i.localId,auth:e,stsTokenManager:l,isAnonymous:o}),h={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:s,metadata:new sd(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!(s!=null&&s.length)};return Object.assign(u,h),u}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fy=new Map;function In(t){Ln(t instanceof Function,"Expected a class definition");let e=fy.get(t);return e?(Ln(e instanceof t,"Instance stored in cache mismatched with class"),e):(e=new t,fy.set(t,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hw{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,n){this.storage[e]=n}async _get(e){const n=this.storage[e];return n===void 0?null:n}async _remove(e){delete this.storage[e]}_addListener(e,n){}_removeListener(e,n){}}Hw.type="NONE";const py=Hw;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hl(t,e,n){return`firebase:${t}:${e}:${n}`}class Hi{constructor(e,n,r){this.persistence=e,this.auth=n,this.userKey=r;const{config:i,name:s}=this.auth;this.fullUserKey=hl(this.userKey,i.apiKey,s),this.fullPersistenceKey=hl("persistence",i.apiKey,s),this.boundEventHandler=n._onStorageEvent.bind(n),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const n=await Zl(this.auth,{idToken:e}).catch(()=>{});return n?Kt._fromGetAccountInfoResponse(this.auth,n,e):null}return Kt._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const n=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,n)return this.setCurrentUser(n)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,n,r="authUser"){if(!n.length)return new Hi(In(py),e,r);const i=(await Promise.all(n.map(async h=>{if(await h._isAvailable())return h}))).filter(h=>h);let s=i[0]||In(py);const o=hl(r,e.config.apiKey,e.name);let l=null;for(const h of n)try{const p=await h._get(o);if(p){let m;if(typeof p=="string"){const g=await Zl(e,{idToken:p}).catch(()=>{});if(!g)break;m=await Kt._fromGetAccountInfoResponse(e,g,p)}else m=Kt._fromJSON(e,p);h!==s&&(l=m),s=h;break}}catch{}const u=i.filter(h=>h._shouldAllowMigration);return!s._shouldAllowMigration||!u.length?new Hi(s,e,r):(s=u[0],l&&await s._set(o,l.toJSON()),await Promise.all(n.map(async h=>{if(h!==s)try{await h._remove(o)}catch{}})),new Hi(s,e,r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function my(t){const e=t.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Qw(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(qw(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(Xw(e))return"Blackberry";if(Jw(e))return"Webos";if(Gw(e))return"Safari";if((e.includes("chrome/")||Kw(e))&&!e.includes("edge/"))return"Chrome";if(Yw(e))return"Android";{const n=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=t.match(n);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function qw(t=ct()){return/firefox\//i.test(t)}function Gw(t=ct()){const e=t.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function Kw(t=ct()){return/crios\//i.test(t)}function Qw(t=ct()){return/iemobile/i.test(t)}function Yw(t=ct()){return/android/i.test(t)}function Xw(t=ct()){return/blackberry/i.test(t)}function Jw(t=ct()){return/webos/i.test(t)}function $f(t=ct()){return/iphone|ipad|ipod/i.test(t)||/macintosh/i.test(t)&&/mobile/i.test(t)}function Gk(t=ct()){var e;return $f(t)&&!!((e=window.navigator)!=null&&e.standalone)}function Kk(){return FS()&&document.documentMode===10}function Zw(t=ct()){return $f(t)||Yw(t)||Jw(t)||Xw(t)||/windows phone/i.test(t)||Qw(t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eT(t,e=[]){let n;switch(t){case"Browser":n=my(ct());break;case"Worker":n=`${my(ct())}-${t}`;break;default:n=t}const r=e.length?e.join(","):"FirebaseCore-web";return`${n}/JsCore/${hs}/${r}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qk{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,n){const r=s=>new Promise((o,l)=>{try{const u=e(s);o(u)}catch(u){l(u)}});r.onAbort=n,this.queue.push(r);const i=this.queue.length-1;return()=>{this.queue[i]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const n=[];try{for(const r of this.queue)await r(e),r.onAbort&&n.push(r.onAbort)}catch(r){n.reverse();for(const i of n)try{i()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Yk(t,e={}){return zn(t,"GET","/v2/passwordPolicy",Un(t,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xk=6;class Jk{constructor(e){var r;const n=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=n.minPasswordLength??Xk,n.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=n.maxPasswordLength),n.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=n.containsLowercaseCharacter),n.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=n.containsUppercaseCharacter),n.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=n.containsNumericCharacter),n.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=n.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((r=e.allowedNonAlphanumericCharacters)==null?void 0:r.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const n={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,n),this.validatePasswordCharacterOptions(e,n),n.isValid&&(n.isValid=n.meetsMinPasswordLength??!0),n.isValid&&(n.isValid=n.meetsMaxPasswordLength??!0),n.isValid&&(n.isValid=n.containsLowercaseLetter??!0),n.isValid&&(n.isValid=n.containsUppercaseLetter??!0),n.isValid&&(n.isValid=n.containsNumericCharacter??!0),n.isValid&&(n.isValid=n.containsNonAlphanumericCharacter??!0),n}validatePasswordLengthOptions(e,n){const r=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;r&&(n.meetsMinPasswordLength=e.length>=r),i&&(n.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,n){this.updatePasswordCharacterOptionsStatuses(n,!1,!1,!1,!1);let r;for(let i=0;i<e.length;i++)r=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(n,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,n,r,i,s){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=n)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zk{constructor(e,n,r,i){this.app=e,this.heartbeatServiceProvider=n,this.appCheckServiceProvider=r,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new gy(this),this.idTokenSubscription=new gy(this),this.beforeStateQueue=new Qk(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=Uw,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion,this._persistenceManagerAvailable=new Promise(s=>this._resolvePersistenceManagerAvailable=s)}_initializeWithPersistence(e,n){return n&&(this._popupRedirectResolver=In(n)),this._initializationPromise=this.queue(async()=>{var r,i,s;if(!this._deleted&&(this.persistenceManager=await Hi.create(this,e),(r=this._resolvePersistenceManagerAvailable)==null||r.call(this),!this._deleted)){if((i=this._popupRedirectResolver)!=null&&i._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(n),this.lastNotifiedUid=((s=this.currentUser)==null?void 0:s.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const n=await Zl(this,{idToken:e}),r=await Kt._fromGetAccountInfoResponse(this,n,e);await this.directlySetCurrentUser(r)}catch(n){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",n),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var s;if(Mt(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(l=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(l,l))}):this.directlySetCurrentUser(null)}const n=await this.assertedPersistence.getCurrentUser();let r=n,i=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(s=this.redirectUser)==null?void 0:s._redirectEventId,l=r==null?void 0:r._redirectEventId,u=await this.tryRedirectSignIn(e);(!o||o===l)&&(u!=null&&u.user)&&(r=u.user,i=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(i)try{await this.beforeStateQueue.runMiddleware(r)}catch(o){r=n,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return Z(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let n=null;try{n=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return n}async reloadAndSetCurrentUserOrClear(e){try{await eu(e)}catch(n){if((n==null?void 0:n.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=xk()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Mt(this.app))return Promise.reject(Rn(this));const n=e?Ge(e):null;return n&&Z(n.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(n&&n._clone(this))}async _updateCurrentUser(e,n=!1){if(!this._deleted)return e&&Z(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),n||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Mt(this.app)?Promise.reject(Rn(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Mt(this.app)?Promise.reject(Rn(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(In(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const n=this._getPasswordPolicyInternal();return n.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):n.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await Yk(this),n=new Jk(e);this.tenantId===null?this._projectPasswordPolicy=n:this._tenantPasswordPolicies[this.tenantId]=n}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new Qo("auth","Firebase",e())}onAuthStateChanged(e,n,r){return this.registerStateListener(this.authStateSubscription,e,n,r)}beforeAuthStateChanged(e,n){return this.beforeStateQueue.pushCallback(e,n)}onIdTokenChanged(e,n,r){return this.registerStateListener(this.idTokenSubscription,e,n,r)}authStateReady(){return new Promise((e,n)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},n)}})}async revokeAccessToken(e){if(this.currentUser){const n=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:n};this.tenantId!=null&&(r.tenantId=this.tenantId),await qk(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,n){const r=await this.getOrInitRedirectPersistenceManager(n);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const n=e&&In(e)||this._popupRedirectResolver;Z(n,this,"argument-error"),this.redirectPersistenceManager=await Hi.create(this,[In(n._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var n,r;return this._isInitialized&&await this.queue(async()=>{}),((n=this._currentUser)==null?void 0:n._redirectEventId)===e?this._currentUser:((r=this.redirectUser)==null?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var n;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((n=this.currentUser)==null?void 0:n.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,n,r,i){if(this._deleted)return()=>{};const s=typeof n=="function"?n:n.next.bind(n);let o=!1;const l=this._isInitialized?Promise.resolve():this._initializationPromise;if(Z(l,this,"internal-error"),l.then(()=>{o||s(this.currentUser)}),typeof n=="function"){const u=e.addObserver(n,r,i);return()=>{o=!0,u()}}else{const u=e.addObserver(n);return()=>{o=!0,u()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return Z(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=eT(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var i;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const n=await((i=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:i.getHeartbeatsHeader());n&&(e["X-Firebase-Client"]=n);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){var n;if(Mt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((n=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:n.getToken());return e!=null&&e.error&&kk(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function Vr(t){return Ge(t)}class gy{constructor(e){this.auth=e,this.observer=null,this.addObserver=qS(n=>this.observer=n)}get next(){return Z(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Mu={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function eP(t){Mu=t}function tT(t){return Mu.loadJS(t)}function tP(){return Mu.recaptchaEnterpriseScript}function nP(){return Mu.gapiScript}function rP(t){return`__${t}${Math.floor(Math.random()*1e6)}`}class iP{constructor(){this.enterprise=new sP}ready(e){e()}execute(e,n){return Promise.resolve("token")}render(e,n){return""}}class sP{ready(e){e()}execute(e,n){return Promise.resolve("token")}render(e,n){return""}}const oP="recaptcha-enterprise",nT="NO_RECAPTCHA";class aP{constructor(e){this.type=oP,this.auth=Vr(e)}async verify(e="verify",n=!1){async function r(s){if(!n){if(s.tenantId==null&&s._agentRecaptchaConfig!=null)return s._agentRecaptchaConfig.siteKey;if(s.tenantId!=null&&s._tenantRecaptchaConfigs[s.tenantId]!==void 0)return s._tenantRecaptchaConfigs[s.tenantId].siteKey}return new Promise(async(o,l)=>{Fk(s,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(u=>{if(u.recaptchaKey===void 0)l(new Error("recaptcha Enterprise site key undefined"));else{const h=new Mk(u);return s.tenantId==null?s._agentRecaptchaConfig=h:s._tenantRecaptchaConfigs[s.tenantId]=h,o(h.siteKey)}}).catch(u=>{l(u)})})}function i(s,o,l){const u=window.grecaptcha;hy(u)?u.enterprise.ready(()=>{u.enterprise.execute(s,{action:e}).then(h=>{o(h)}).catch(()=>{o(nT)})}):l(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new iP().execute("siteKey",{action:"verify"}):new Promise((s,o)=>{r(this.auth).then(l=>{if(!n&&hy(window.grecaptcha))i(l,s,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let u=tP();u.length!==0&&(u+=l),tT(u).then(()=>{i(l,s,o)}).catch(h=>{o(h)})}}).catch(l=>{o(l)})})}}async function yy(t,e,n,r=!1,i=!1){const s=new aP(t);let o;if(i)o=nT;else try{o=await s.verify(n)}catch{o=await s.verify(n,!0)}const l={...e};if(n==="mfaSmsEnrollment"||n==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in l){const u=l.phoneEnrollmentInfo.phoneNumber,h=l.phoneEnrollmentInfo.recaptchaToken;Object.assign(l,{phoneEnrollmentInfo:{phoneNumber:u,recaptchaToken:h,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in l){const u=l.phoneSignInInfo.recaptchaToken;Object.assign(l,{phoneSignInInfo:{recaptchaToken:u,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return l}return r?Object.assign(l,{captchaResp:o}):Object.assign(l,{captchaResponse:o}),Object.assign(l,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(l,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),l}async function tu(t,e,n,r,i){var s;if((s=t._getRecaptchaConfig())!=null&&s.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const o=await yy(t,e,n,n==="getOobCode");return r(t,o)}else return r(t,e).catch(async o=>{if(o.code==="auth/missing-recaptcha-token"){console.log(`${n} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const l=await yy(t,e,n,n==="getOobCode");return r(t,l)}else return Promise.reject(o)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lP(t,e){const n=sf(t,"auth");if(n.isInitialized()){const i=n.getImmediate(),s=n.getOptions();if(ti(s,e??{}))return i;en(i,"already-initialized")}return n.initialize({options:e})}function uP(t,e){const n=(e==null?void 0:e.persistence)||[],r=(Array.isArray(n)?n:[n]).map(In);e!=null&&e.errorMap&&t._updateErrorMap(e.errorMap),t._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}function cP(t,e,n){const r=Vr(t);Z(/^https?:\/\//.test(e),r,"invalid-emulator-scheme");const i=!1,s=rT(e),{host:o,port:l}=hP(e),u=l===null?"":`:${l}`,h={url:`${s}//${o}${u}/`},p=Object.freeze({host:o,port:l,protocol:s.replace(":",""),options:Object.freeze({disableWarnings:i})});if(!r._canInitEmulator){Z(r.config.emulator&&r.emulatorConfig,r,"emulator-config-failed"),Z(ti(h,r.config.emulator)&&ti(p,r.emulatorConfig),r,"emulator-config-failed");return}r.config.emulator=h,r.emulatorConfig=p,r.settings.appVerificationDisabledForTesting=!0,Xo(o)?X_(`${s}//${o}${u}`):dP()}function rT(t){const e=t.indexOf(":");return e<0?"":t.substr(0,e+1)}function hP(t){const e=rT(t),n=/(\/\/)?([^?#/]+)/.exec(t.substr(e.length));if(!n)return{host:"",port:null};const r=n[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(r);if(i){const s=i[1];return{host:s,port:vy(r.substr(s.length+1))}}else{const[s,o]=r.split(":");return{host:s,port:vy(o)}}}function vy(t){if(!t)return null;const e=Number(t);return isNaN(e)?null:e}function dP(){function t(){const e=document.createElement("p"),n=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",n.position="fixed",n.width="100%",n.backgroundColor="#ffffff",n.border=".1em solid #000000",n.color="#b50000",n.bottom="0px",n.left="0px",n.margin="0px",n.zIndex="10000",n.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",t):t())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wf{constructor(e,n){this.providerId=e,this.signInMethod=n}toJSON(){return Tn("not implemented")}_getIdTokenResponse(e){return Tn("not implemented")}_linkToIdToken(e,n){return Tn("not implemented")}_getReauthenticationResolver(e){return Tn("not implemented")}}async function fP(t,e){return zn(t,"POST","/v1/accounts:signUp",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function pP(t,e){return ia(t,"POST","/v1/accounts:signInWithPassword",Un(t,e))}async function iT(t,e){return zn(t,"POST","/v1/accounts:sendOobCode",Un(t,e))}async function mP(t,e){return iT(t,e)}async function gP(t,e){return iT(t,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function yP(t,e){return ia(t,"POST","/v1/accounts:signInWithEmailLink",Un(t,e))}async function vP(t,e){return ia(t,"POST","/v1/accounts:signInWithEmailLink",Un(t,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $o extends Wf{constructor(e,n,r,i=null){super("password",r),this._email=e,this._password=n,this._tenantId=i}static _fromEmailAndPassword(e,n){return new $o(e,n,"password")}static _fromEmailAndCode(e,n,r=null){return new $o(e,n,"emailLink",r)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const n=typeof e=="string"?JSON.parse(e):e;if(n!=null&&n.email&&(n!=null&&n.password)){if(n.signInMethod==="password")return this._fromEmailAndPassword(n.email,n.password);if(n.signInMethod==="emailLink")return this._fromEmailAndCode(n.email,n.password,n.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const n={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return tu(e,n,"signInWithPassword",pP);case"emailLink":return yP(e,{email:this._email,oobCode:this._password});default:en(e,"internal-error")}}async _linkToIdToken(e,n){switch(this.signInMethod){case"password":const r={idToken:n,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return tu(e,r,"signUpPassword",fP);case"emailLink":return vP(e,{idToken:n,email:this._email,oobCode:this._password});default:en(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qi(t,e){return ia(t,"POST","/v1/accounts:signInWithIdp",Un(t,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _P="http://localhost";class oi extends Wf{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const n=new oi(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(n.idToken=e.idToken),e.accessToken&&(n.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(n.nonce=e.nonce),e.pendingToken&&(n.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(n.accessToken=e.oauthToken,n.secret=e.oauthTokenSecret):en("argument-error"),n}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const n=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:i,...s}=n;if(!r||!i)return null;const o=new oi(r,i);return o.idToken=s.idToken||void 0,o.accessToken=s.accessToken||void 0,o.secret=s.secret,o.nonce=s.nonce,o.pendingToken=s.pendingToken||null,o}_getIdTokenResponse(e){const n=this.buildRequest();return qi(e,n)}_linkToIdToken(e,n){const r=this.buildRequest();return r.idToken=n,qi(e,r)}_getReauthenticationResolver(e){const n=this.buildRequest();return n.autoCreate=!1,qi(e,n)}buildRequest(){const e={requestUri:_P,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const n={};this.idToken&&(n.id_token=this.idToken),this.accessToken&&(n.access_token=this.accessToken),this.secret&&(n.oauth_token_secret=this.secret),n.providerId=this.providerId,this.nonce&&!this.pendingToken&&(n.nonce=this.nonce),e.postBody=Yo(n)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function EP(t){switch(t){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function wP(t){const e=Ys(Xs(t)).link,n=e?Ys(Xs(e)).deep_link_id:null,r=Ys(Xs(t)).deep_link_id;return(r?Ys(Xs(r)).link:null)||r||n||e||t}class Hf{constructor(e){const n=Ys(Xs(e)),r=n.apiKey??null,i=n.oobCode??null,s=EP(n.mode??null);Z(r&&i&&s,"argument-error"),this.apiKey=r,this.operation=s,this.code=i,this.continueUrl=n.continueUrl??null,this.languageCode=n.lang??null,this.tenantId=n.tenantId??null}static parseLink(e){const n=wP(e);try{return new Hf(n)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ys{constructor(){this.providerId=ys.PROVIDER_ID}static credential(e,n){return $o._fromEmailAndPassword(e,n)}static credentialWithLink(e,n){const r=Hf.parseLink(n);return Z(r,"argument-error"),$o._fromEmailAndCode(e,r.code,r.tenantId)}}ys.PROVIDER_ID="password";ys.EMAIL_PASSWORD_SIGN_IN_METHOD="password";ys.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sT{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sa extends sT{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zn extends sa{constructor(){super("facebook.com")}static credential(e){return oi._fromParams({providerId:Zn.PROVIDER_ID,signInMethod:Zn.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Zn.credentialFromTaggedObject(e)}static credentialFromError(e){return Zn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Zn.credential(e.oauthAccessToken)}catch{return null}}}Zn.FACEBOOK_SIGN_IN_METHOD="facebook.com";Zn.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class er extends sa{constructor(){super("google.com"),this.addScope("profile")}static credential(e,n){return oi._fromParams({providerId:er.PROVIDER_ID,signInMethod:er.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:n})}static credentialFromResult(e){return er.credentialFromTaggedObject(e)}static credentialFromError(e){return er.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:n,oauthAccessToken:r}=e;if(!n&&!r)return null;try{return er.credential(n,r)}catch{return null}}}er.GOOGLE_SIGN_IN_METHOD="google.com";er.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tr extends sa{constructor(){super("github.com")}static credential(e){return oi._fromParams({providerId:tr.PROVIDER_ID,signInMethod:tr.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return tr.credentialFromTaggedObject(e)}static credentialFromError(e){return tr.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return tr.credential(e.oauthAccessToken)}catch{return null}}}tr.GITHUB_SIGN_IN_METHOD="github.com";tr.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nr extends sa{constructor(){super("twitter.com")}static credential(e,n){return oi._fromParams({providerId:nr.PROVIDER_ID,signInMethod:nr.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:n})}static credentialFromResult(e){return nr.credentialFromTaggedObject(e)}static credentialFromError(e){return nr.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:n,oauthTokenSecret:r}=e;if(!n||!r)return null;try{return nr.credential(n,r)}catch{return null}}}nr.TWITTER_SIGN_IN_METHOD="twitter.com";nr.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function TP(t,e){return ia(t,"POST","/v1/accounts:signUp",Un(t,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ai{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,n,r,i=!1){const s=await Kt._fromIdTokenResponse(e,r,i),o=_y(r);return new ai({user:s,providerId:o,_tokenResponse:r,operationType:n})}static async _forOperation(e,n,r){await e._updateTokensIfNecessary(r,!0);const i=_y(r);return new ai({user:e,providerId:i,_tokenResponse:r,operationType:n})}}function _y(t){return t.providerId?t.providerId:"phoneNumber"in t?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nu extends Fn{constructor(e,n,r,i){super(n.code,n.message),this.operationType=r,this.user=i,Object.setPrototypeOf(this,nu.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:n.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,n,r,i){return new nu(e,n,r,i)}}function oT(t,e,n,r){return(e==="reauthenticate"?n._getReauthenticationResolver(t):n._getIdTokenResponse(t)).catch(s=>{throw s.code==="auth/multi-factor-auth-required"?nu._fromErrorAndOperation(t,s,e,r):s})}async function IP(t,e,n=!1){const r=await jo(t,e._linkToIdToken(t.auth,await t.getIdToken()),n);return ai._forOperation(t,"link",r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function SP(t,e,n=!1){const{auth:r}=t;if(Mt(r.app))return Promise.reject(Rn(r));const i="reauthenticate";try{const s=await jo(t,oT(r,i,e,t),n);Z(s.idToken,r,"internal-error");const o=jf(s.idToken);Z(o,r,"internal-error");const{sub:l}=o;return Z(t.uid===l,r,"user-mismatch"),ai._forOperation(t,i,s)}catch(s){throw(s==null?void 0:s.code)==="auth/user-not-found"&&en(r,"user-mismatch"),s}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function aT(t,e,n=!1){if(Mt(t.app))return Promise.reject(Rn(t));const r="signIn",i=await oT(t,r,e),s=await ai._fromIdTokenResponse(t,r,i);return n||await t._updateCurrentUser(s.user),s}async function AP(t,e){return aT(Vr(t),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function lT(t){const e=Vr(t);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function CP(t,e,n){const r=Vr(t);await tu(r,{requestType:"PASSWORD_RESET",email:e,clientType:"CLIENT_TYPE_WEB"},"getOobCode",gP)}async function RP(t,e,n){if(Mt(t.app))return Promise.reject(Rn(t));const r=Vr(t),o=await tu(r,{returnSecureToken:!0,email:e,password:n,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",TP).catch(u=>{throw u.code==="auth/password-does-not-meet-requirements"&&lT(t),u}),l=await ai._fromIdTokenResponse(r,"signIn",o);return await r._updateCurrentUser(l.user),l}function kP(t,e,n){return Mt(t.app)?Promise.reject(Rn(t)):AP(Ge(t),ys.credential(e,n)).catch(async r=>{throw r.code==="auth/password-does-not-meet-requirements"&&lT(t),r})}async function Ey(t,e){const n=Ge(t),i={requestType:"VERIFY_EMAIL",idToken:await t.getIdToken()},{email:s}=await mP(n.auth,i);s!==t.email&&await t.reload()}function PP(t,e,n,r){return Ge(t).onIdTokenChanged(e,n,r)}function NP(t,e,n){return Ge(t).beforeAuthStateChanged(e,n)}function xP(t,e,n,r){return Ge(t).onAuthStateChanged(e,n,r)}function Hs(t){return Ge(t).signOut()}const ru="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uT{constructor(e,n){this.storageRetriever=e,this.type=n}_isAvailable(){try{return this.storage?(this.storage.setItem(ru,"1"),this.storage.removeItem(ru),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,n){return this.storage.setItem(e,JSON.stringify(n)),Promise.resolve()}_get(e){const n=this.storage.getItem(e);return Promise.resolve(n?JSON.parse(n):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bP=1e3,DP=10;class cT extends uT{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,n)=>this.onStorageEvent(e,n),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Zw(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const n of Object.keys(this.listeners)){const r=this.storage.getItem(n),i=this.localCache[n];r!==i&&e(n,i,r)}}onStorageEvent(e,n=!1){if(!e.key){this.forAllChangedKeys((o,l,u)=>{this.notifyListeners(o,u)});return}const r=e.key;n?this.detachListener():this.stopPolling();const i=()=>{const o=this.storage.getItem(r);!n&&this.localCache[r]===o||this.notifyListeners(r,o)},s=this.storage.getItem(r);Kk()&&s!==e.newValue&&e.newValue!==e.oldValue?setTimeout(i,DP):i()}notifyListeners(e,n){this.localCache[e]=n;const r=this.listeners[e];if(r)for(const i of Array.from(r))i(n&&JSON.parse(n))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,n,r)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:n,newValue:r}),!0)})},bP)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,n){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(n)}_removeListener(e,n){this.listeners[e]&&(this.listeners[e].delete(n),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,n){await super._set(e,n),this.localCache[e]=JSON.stringify(n)}async _get(e){const n=await super._get(e);return this.localCache[e]=JSON.stringify(n),n}async _remove(e){await super._remove(e),delete this.localCache[e]}}cT.type="LOCAL";const VP=cT;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hT extends uT{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,n){}_removeListener(e,n){}}hT.type="SESSION";const dT=hT;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function OP(t){return Promise.all(t.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(n){return{fulfilled:!1,reason:n}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fu{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const n=this.receivers.find(i=>i.isListeningto(e));if(n)return n;const r=new Fu(e);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const n=e,{eventId:r,eventType:i,data:s}=n.data,o=this.handlersMap[i];if(!(o!=null&&o.size))return;n.ports[0].postMessage({status:"ack",eventId:r,eventType:i});const l=Array.from(o).map(async h=>h(n.origin,s)),u=await OP(l);n.ports[0].postMessage({status:"done",eventId:r,eventType:i,response:u})}_subscribe(e,n){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(n)}_unsubscribe(e,n){this.handlersMap[e]&&n&&this.handlersMap[e].delete(n),(!n||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Fu.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qf(t="",e=10){let n="";for(let r=0;r<e;r++)n+=Math.floor(Math.random()*10);return t+n}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class LP{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,n,r=50){const i=typeof MessageChannel<"u"?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let s,o;return new Promise((l,u)=>{const h=qf("",20);i.port1.start();const p=setTimeout(()=>{u(new Error("unsupported_event"))},r);o={messageChannel:i,onMessage(m){const g=m;if(g.data.eventId===h)switch(g.data.status){case"ack":clearTimeout(p),s=setTimeout(()=>{u(new Error("timeout"))},3e3);break;case"done":clearTimeout(s),l(g.data.response);break;default:clearTimeout(p),clearTimeout(s),u(new Error("invalid_response"));break}}},this.handlers.add(o),i.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:h,data:n},[i.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pn(){return window}function MP(t){pn().location.href=t}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fT(){return typeof pn().WorkerGlobalScope<"u"&&typeof pn().importScripts=="function"}async function FP(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function UP(){var t;return((t=navigator==null?void 0:navigator.serviceWorker)==null?void 0:t.controller)||null}function zP(){return fT()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pT="firebaseLocalStorageDb",BP=1,iu="firebaseLocalStorage",mT="fbase_key";class oa{constructor(e){this.request=e}toPromise(){return new Promise((e,n)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{n(this.request.error)})})}}function Uu(t,e){return t.transaction([iu],e?"readwrite":"readonly").objectStore(iu)}function jP(){const t=indexedDB.deleteDatabase(pT);return new oa(t).toPromise()}function od(){const t=indexedDB.open(pT,BP);return new Promise((e,n)=>{t.addEventListener("error",()=>{n(t.error)}),t.addEventListener("upgradeneeded",()=>{const r=t.result;try{r.createObjectStore(iu,{keyPath:mT})}catch(i){n(i)}}),t.addEventListener("success",async()=>{const r=t.result;r.objectStoreNames.contains(iu)?e(r):(r.close(),await jP(),e(await od()))})})}async function wy(t,e,n){const r=Uu(t,!0).put({[mT]:e,value:n});return new oa(r).toPromise()}async function $P(t,e){const n=Uu(t,!1).get(e),r=await new oa(n).toPromise();return r===void 0?null:r.value}function Ty(t,e){const n=Uu(t,!0).delete(e);return new oa(n).toPromise()}const WP=800,HP=3;class gT{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await od(),this.db)}async _withRetries(e){let n=0;for(;;)try{const r=await this._openDb();return await e(r)}catch(r){if(n++>HP)throw r;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return fT()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Fu._getInstance(zP()),this.receiver._subscribe("keyChanged",async(e,n)=>({keyProcessed:(await this._poll()).includes(n.key)})),this.receiver._subscribe("ping",async(e,n)=>["keyChanged"])}async initializeSender(){var n,r;if(this.activeServiceWorker=await FP(),!this.activeServiceWorker)return;this.sender=new LP(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(n=e[0])!=null&&n.fulfilled&&(r=e[0])!=null&&r.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||UP()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await od();return await wy(e,ru,"1"),await Ty(e,ru),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,n){return this._withPendingWrite(async()=>(await this._withRetries(r=>wy(r,e,n)),this.localCache[e]=n,this.notifyServiceWorker(e)))}async _get(e){const n=await this._withRetries(r=>$P(r,e));return this.localCache[e]=n,n}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(n=>Ty(n,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(i=>{const s=Uu(i,!1).getAll();return new oa(s).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const n=[],r=new Set;if(e.length!==0)for(const{fbase_key:i,value:s}of e)r.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(s)&&(this.notifyListeners(i,s),n.push(i));for(const i of Object.keys(this.localCache))this.localCache[i]&&!r.has(i)&&(this.notifyListeners(i,null),n.push(i));return n}notifyListeners(e,n){this.localCache[e]=n;const r=this.listeners[e];if(r)for(const i of Array.from(r))i(n)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),WP)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,n){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(n)}_removeListener(e,n){this.listeners[e]&&(this.listeners[e].delete(n),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}gT.type="LOCAL";const qP=gT;new ra(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function GP(t,e){return e?In(e):(Z(t._popupRedirectResolver,t,"argument-error"),t._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gf extends Wf{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return qi(e,this._buildIdpRequest())}_linkToIdToken(e,n){return qi(e,this._buildIdpRequest(n))}_getReauthenticationResolver(e){return qi(e,this._buildIdpRequest())}_buildIdpRequest(e){const n={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(n.idToken=e),n}}function KP(t){return aT(t.auth,new Gf(t),t.bypassAuthState)}function QP(t){const{auth:e,user:n}=t;return Z(n,e,"internal-error"),SP(n,new Gf(t),t.bypassAuthState)}async function YP(t){const{auth:e,user:n}=t;return Z(n,e,"internal-error"),IP(n,new Gf(t),t.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yT{constructor(e,n,r,i,s=!1){this.auth=e,this.resolver=r,this.user=i,this.bypassAuthState=s,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(n)?n:[n]}execute(){return new Promise(async(e,n)=>{this.pendingPromise={resolve:e,reject:n};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(r){this.reject(r)}})}async onAuthEvent(e){const{urlResponse:n,sessionId:r,postBody:i,tenantId:s,error:o,type:l}=e;if(o){this.reject(o);return}const u={auth:this.auth,requestUri:n,sessionId:r,tenantId:s||void 0,postBody:i||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(l)(u))}catch(h){this.reject(h)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return KP;case"linkViaPopup":case"linkViaRedirect":return YP;case"reauthViaPopup":case"reauthViaRedirect":return QP;default:en(this.auth,"internal-error")}}resolve(e){Ln(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Ln(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const XP=new ra(2e3,1e4);class Di extends yT{constructor(e,n,r,i,s){super(e,n,i,s),this.provider=r,this.authWindow=null,this.pollId=null,Di.currentPopupAction&&Di.currentPopupAction.cancel(),Di.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return Z(e,this.auth,"internal-error"),e}async onExecution(){Ln(this.filter.length===1,"Popup operations only handle one event");const e=qf();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(n=>{this.reject(n)}),this.resolver._isIframeWebStorageSupported(this.auth,n=>{n||this.reject(fn(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(fn(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,Di.currentPopupAction=null}pollUserCancellation(){const e=()=>{var n,r;if((r=(n=this.authWindow)==null?void 0:n.window)!=null&&r.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(fn(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,XP.get())};e()}}Di.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const JP="pendingRedirect",dl=new Map;class ZP extends yT{constructor(e,n,r=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],n,void 0,r),this.eventId=null}async execute(){let e=dl.get(this.auth._key());if(!e){try{const r=await eN(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(r)}catch(n){e=()=>Promise.reject(n)}dl.set(this.auth._key(),e)}return this.bypassAuthState||dl.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const n=await this.auth._redirectUserForId(e.eventId);if(n)return this.user=n,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function eN(t,e){const n=rN(e),r=nN(t);if(!await r._isAvailable())return!1;const i=await r._get(n)==="true";return await r._remove(n),i}function tN(t,e){dl.set(t._key(),e)}function nN(t){return In(t._redirectPersistence)}function rN(t){return hl(JP,t.config.apiKey,t.name)}async function iN(t,e,n=!1){if(Mt(t.app))return Promise.reject(Rn(t));const r=Vr(t),i=GP(r,e),o=await new ZP(r,i,n).execute();return o&&!n&&(delete o.user._redirectEventId,await r._persistUserIfCurrent(o.user),await r._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sN=10*60*1e3;class oN{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let n=!1;return this.consumers.forEach(r=>{this.isEventForConsumer(e,r)&&(n=!0,this.sendToConsumer(e,r),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!aN(e)||(this.hasHandledPotentialRedirect=!0,n||(this.queuedRedirectEvent=e,n=!0)),n}sendToConsumer(e,n){var r;if(e.error&&!vT(e)){const i=((r=e.error.code)==null?void 0:r.split("auth/")[1])||"internal-error";n.onError(fn(this.auth,i))}else n.onAuthEvent(e)}isEventForConsumer(e,n){const r=n.eventId===null||!!e.eventId&&e.eventId===n.eventId;return n.filter.includes(e.type)&&r}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=sN&&this.cachedEventUids.clear(),this.cachedEventUids.has(Iy(e))}saveEventToCache(e){this.cachedEventUids.add(Iy(e)),this.lastProcessedEventTime=Date.now()}}function Iy(t){return[t.type,t.eventId,t.sessionId,t.tenantId].filter(e=>e).join("-")}function vT({type:t,error:e}){return t==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function aN(t){switch(t.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return vT(t);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function lN(t,e={}){return zn(t,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uN=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,cN=/^https?/;async function hN(t){if(t.config.emulator)return;const{authorizedDomains:e}=await lN(t);for(const n of e)try{if(dN(n))return}catch{}en(t,"unauthorized-domain")}function dN(t){const e=id(),{protocol:n,hostname:r}=new URL(e);if(t.startsWith("chrome-extension://")){const o=new URL(t);return o.hostname===""&&r===""?n==="chrome-extension:"&&t.replace("chrome-extension://","")===e.replace("chrome-extension://",""):n==="chrome-extension:"&&o.hostname===r}if(!cN.test(n))return!1;if(uN.test(t))return r===t;const i=t.replace(/\./g,"\\.");return new RegExp("^(.+\\."+i+"|"+i+")$","i").test(r)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fN=new ra(3e4,6e4);function Sy(){const t=pn().___jsl;if(t!=null&&t.H){for(const e of Object.keys(t.H))if(t.H[e].r=t.H[e].r||[],t.H[e].L=t.H[e].L||[],t.H[e].r=[...t.H[e].L],t.CP)for(let n=0;n<t.CP.length;n++)t.CP[n]=null}}function pN(t){return new Promise((e,n)=>{var i,s,o;function r(){Sy(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Sy(),n(fn(t,"network-request-failed"))},timeout:fN.get()})}if((s=(i=pn().gapi)==null?void 0:i.iframes)!=null&&s.Iframe)e(gapi.iframes.getContext());else if((o=pn().gapi)!=null&&o.load)r();else{const l=rP("iframefcb");return pn()[l]=()=>{gapi.load?r():n(fn(t,"network-request-failed"))},tT(`${nP()}?onload=${l}`).catch(u=>n(u))}}).catch(e=>{throw fl=null,e})}let fl=null;function mN(t){return fl=fl||pN(t),fl}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gN=new ra(5e3,15e3),yN="__/auth/iframe",vN="emulator/auth/iframe",_N={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},EN=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function wN(t){const e=t.config;Z(e.authDomain,t,"auth-domain-config-required");const n=e.emulator?Bf(e,vN):`https://${t.config.authDomain}/${yN}`,r={apiKey:e.apiKey,appName:t.name,v:hs},i=EN.get(t.config.apiHost);i&&(r.eid=i);const s=t._getFrameworks();return s.length&&(r.fw=s.join(",")),`${n}?${Yo(r).slice(1)}`}async function TN(t){const e=await mN(t),n=pn().gapi;return Z(n,t,"internal-error"),e.open({where:document.body,url:wN(t),messageHandlersFilter:n.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:_N,dontclear:!0},r=>new Promise(async(i,s)=>{await r.restyle({setHideOnLeave:!1});const o=fn(t,"network-request-failed"),l=pn().setTimeout(()=>{s(o)},gN.get());function u(){pn().clearTimeout(l),i(r)}r.ping(u).then(u,()=>{s(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const IN={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},SN=500,AN=600,CN="_blank",RN="http://localhost";class Ay{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function kN(t,e,n,r=SN,i=AN){const s=Math.max((window.screen.availHeight-i)/2,0).toString(),o=Math.max((window.screen.availWidth-r)/2,0).toString();let l="";const u={...IN,width:r.toString(),height:i.toString(),top:s,left:o},h=ct().toLowerCase();n&&(l=Kw(h)?CN:n),qw(h)&&(e=e||RN,u.scrollbars="yes");const p=Object.entries(u).reduce((g,[_,N])=>`${g}${_}=${N},`,"");if(Gk(h)&&l!=="_self")return PN(e||"",l),new Ay(null);const m=window.open(e||"",l,p);Z(m,t,"popup-blocked");try{m.focus()}catch{}return new Ay(m)}function PN(t,e){const n=document.createElement("a");n.href=t,n.target=e;const r=document.createEvent("MouseEvent");r.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),n.dispatchEvent(r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const NN="__/auth/handler",xN="emulator/auth/handler",bN=encodeURIComponent("fac");async function Cy(t,e,n,r,i,s){Z(t.config.authDomain,t,"auth-domain-config-required"),Z(t.config.apiKey,t,"invalid-api-key");const o={apiKey:t.config.apiKey,appName:t.name,authType:n,redirectUrl:r,v:hs,eventId:i};if(e instanceof sT){e.setDefaultLanguage(t.languageCode),o.providerId=e.providerId||"",HS(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[p,m]of Object.entries({}))o[p]=m}if(e instanceof sa){const p=e.getScopes().filter(m=>m!=="");p.length>0&&(o.scopes=p.join(","))}t.tenantId&&(o.tid=t.tenantId);const l=o;for(const p of Object.keys(l))l[p]===void 0&&delete l[p];const u=await t._getAppCheckToken(),h=u?`#${bN}=${encodeURIComponent(u)}`:"";return`${DN(t)}?${Yo(l).slice(1)}${h}`}function DN({config:t}){return t.emulator?Bf(t,xN):`https://${t.authDomain}/${NN}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wc="webStorageSupport";class VN{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=dT,this._completeRedirectFn=iN,this._overrideRedirectResult=tN}async _openPopup(e,n,r,i){var o;Ln((o=this.eventManagers[e._key()])==null?void 0:o.manager,"_initialize() not called before _openPopup()");const s=await Cy(e,n,r,id(),i);return kN(e,s,qf())}async _openRedirect(e,n,r,i){await this._originValidation(e);const s=await Cy(e,n,r,id(),i);return MP(s),new Promise(()=>{})}_initialize(e){const n=e._key();if(this.eventManagers[n]){const{manager:i,promise:s}=this.eventManagers[n];return i?Promise.resolve(i):(Ln(s,"If manager is not set, promise should be"),s)}const r=this.initAndGetManager(e);return this.eventManagers[n]={promise:r},r.catch(()=>{delete this.eventManagers[n]}),r}async initAndGetManager(e){const n=await TN(e),r=new oN(e);return n.register("authEvent",i=>(Z(i==null?void 0:i.authEvent,e,"invalid-auth-event"),{status:r.onEvent(i.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:r},this.iframes[e._key()]=n,r}_isIframeWebStorageSupported(e,n){this.iframes[e._key()].send(Wc,{type:Wc},i=>{var o;const s=(o=i==null?void 0:i[0])==null?void 0:o[Wc];s!==void 0&&n(!!s),en(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const n=e._key();return this.originValidationPromises[n]||(this.originValidationPromises[n]=hN(e)),this.originValidationPromises[n]}get _shouldInitProactively(){return Zw()||Gw()||$f()}}const ON=VN;var Ry="@firebase/auth",ky="1.12.2";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class LN{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const n=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,n),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const n=this.internalListeners.get(e);n&&(this.internalListeners.delete(e),n(),this.updateProactiveRefresh())}assertAuthConfigured(){Z(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function MN(t){switch(t){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function FN(t){es(new ni("auth",(e,{options:n})=>{const r=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),s=e.getProvider("app-check-internal"),{apiKey:o,authDomain:l}=r.options;Z(o&&!o.includes(":"),"invalid-api-key",{appName:r.name});const u={apiKey:o,authDomain:l,clientPlatform:t,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:eT(t)},h=new Zk(r,i,s,u);return uP(h,n),h},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,n,r)=>{e.getProvider("auth-internal").initialize()})),es(new ni("auth-internal",e=>{const n=Vr(e.getProvider("auth").getImmediate());return(r=>new LN(r))(n)},"PRIVATE").setInstantiationMode("EXPLICIT")),gr(Ry,ky,MN(t)),gr(Ry,ky,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const UN=5*60,zN=Y_("authIdTokenMaxAge")||UN;let Py=null;const BN=t=>async e=>{const n=e&&await e.getIdTokenResult(),r=n&&(new Date().getTime()-Date.parse(n.issuedAtTime))/1e3;if(r&&r>zN)return;const i=n==null?void 0:n.token;Py!==i&&(Py=i,await fetch(t,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))};function jN(t=tE()){const e=sf(t,"auth");if(e.isInitialized())return e.getImmediate();const n=lP(t,{popupRedirectResolver:ON,persistence:[qP,VP,dT]}),r=Y_("authTokenSyncURL");if(r&&typeof isSecureContext=="boolean"&&isSecureContext){const s=new URL(r,location.origin);if(location.origin===s.origin){const o=BN(s.toString());NP(n,o,()=>o(n.currentUser)),PP(n,l=>o(l))}}const i=K_("auth");return i&&cP(n,`http://${i}`),n}function $N(){var t;return((t=document.getElementsByTagName("head"))==null?void 0:t[0])??document}eP({loadJS(t){return new Promise((e,n)=>{const r=document.createElement("script");r.setAttribute("src",t),r.onload=e,r.onerror=i=>{const s=fn("internal-error");s.customData=i,n(s)},r.type="text/javascript",r.charset="UTF-8",$N().appendChild(r)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});FN("Browser");const WN={apiKey:"AIzaSyA3YbJ0f7haJ3rQj9ZDV4XKHixurJ6VPN4",authDomain:"ledger-app-599cc.firebaseapp.com",projectId:"ledger-app-599cc",storageBucket:"ledger-app-599cc.firebasestorage.app",messagingSenderId:"374078093945",appId:"1:374078093945:web:5db233b446a9f808a5f2a8"},_T=eE(WN),kn=ck(_T),Wt=jN(_T),ET=J.createContext();function HN({children:t}){const[e,n]=J.useState(null),[r,i]=J.useState(!0);J.useEffect(()=>{const h=xP(Wt,async p=>{if(p)try{if(!p.emailVerified){await Hs(Wt),n(null),i(!1);return}const m=kr(kn,"users",p.uid),g=await Ff(m),_=g.exists()?g.data():{};if(_!=null&&_.blocked){alert("Your account is blocked. Contact admin."),await Hs(Wt),n(null),i(!1);return}n({id:p.uid,name:(_==null?void 0:_.name)||"",email:(_==null?void 0:_.email)||p.email,phone:(_==null?void 0:_.phone)||"",role:(_==null?void 0:_.role)||"user",blocked:(_==null?void 0:_.blocked)||!1}),ng(p.uid)}catch(m){console.error("Profile load error:",m)}else n(null);i(!1)});return()=>h()},[]);async function s(h,p){try{const m=await kP(Wt,h,p);if(!m.user.emailVerified)return await Hs(Wt),{error:"Please verify your email before logging in."};const g={id:m.user.uid,email:h,role:"user"};return n(g),ng(g.id),{success:!0,user:g}}catch(m){return m.code==="auth/user-not-found"?{error:"User not found. Please register."}:m.code==="auth/wrong-password"?{error:"Incorrect password."}:m.code==="auth/invalid-email"?{error:"Invalid email format."}:{error:m.message}}}async function o(h,p,m,g){try{const _=Array.isArray(g)?g.join(""):g,N=await RP(Wt,p,_),R=N.user.uid;await N.user.getIdToken(!0),console.log("AUTH READY, creating Firestore doc..."),await Lw(kr(kn,"users",R),{name:h,email:p,phone:m,role:"user",blocked:!1,createdAt:new Date().toISOString(),income:[],expenses:[],invoices:[],customers:[],goals:[]}),console.log("FIRESTORE SUCCESS");try{await Ey(N.user),console.log("VERIFICATION EMAIL SENT")}catch(k){console.error("EMAIL ERROR:",k)}return await Hs(Wt),{success:!0,message:"Account created. Please verify your email before login."}}catch(_){return console.error("REGISTER ERROR:",_),_.code==="auth/email-already-in-use"?{error:"User already exists. Please login."}:{error:_.message}}}async function l(){try{return Wt.currentUser?(await Ey(Wt.currentUser),{success:!0}):{error:"No user logged in"}}catch{return{error:"Failed to resend email"}}}function u(){Hs(Wt),n(null),ES()}return f.createElement(ET.Provider,{value:{user:e,loading:r,login:s,register:o,logout:u,setUser:n,forgotPassword:qN,resendVerification:l}},t)}function vs(){return J.useContext(ET)}async function qN(t){try{return await CP(Wt,t),{success:!0}}catch{return{error:"Failed to send reset email"}}}function Ny(){return Math.random().toString(36).slice(2,9)}const os=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],GN=[{code:"USD",symbol:"$",name:"US Dollar",flag:"🇺🇸"},{code:"EUR",symbol:"€",name:"Euro",flag:"🇪🇺"},{code:"GBP",symbol:"£",name:"British Pound",flag:"🇬🇧"},{code:"INR",symbol:"₹",name:"Indian Rupee",flag:"🇮🇳"},{code:"AED",symbol:"د.إ",name:"UAE Dirham",flag:"🇦🇪"},{code:"CAD",symbol:"CA$",name:"Canadian Dollar",flag:"🇨🇦"},{code:"AUD",symbol:"A$",name:"Australian Dollar",flag:"🇦🇺"},{code:"SGD",symbol:"S$",name:"Singapore Dollar",flag:"🇸🇬"},{code:"JPY",symbol:"¥",name:"Japanese Yen",flag:"🇯🇵"},{code:"CHF",symbol:"Fr",name:"Swiss Franc",flag:"🇨🇭"},{code:"NGN",symbol:"₦",name:"Nigerian Naira",flag:"🇳🇬"},{code:"ZAR",symbol:"R",name:"South African Rand",flag:"🇿🇦"}];function ge(t,e){return`${e}${Math.abs(Number(t)||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`}function _r(t){return t?new Date(t+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}function zu(t,e){return`${t}-${String(e+1).padStart(2,"0")}`}function Vt(t){return(t||[]).reduce((e,n)=>e+(Number(n.qty)||0)*(Number(n.rate)||0),0)}function KN(t){const e=["#7EE8A2","#67B2FF","#F6C94E","#C084FC","#FF6E6E","#FB923C","#22D3EE"];let n=0;for(let r=0;r<(t||"").length;r++)n=n*31+t.charCodeAt(r)>>>0;return e[n%e.length]}function QN(t){return(t||"?").split(" ").map(e=>e[0]).slice(0,2).join("").toUpperCase()}function Sn({title:t,onClose:e,onSave:n,saveLabel:r="Save",canSave:i=!0,accentColor:s,children:o}){const l=s||"var(--accent)";return f.createElement("div",{className:"modal-overlay",onClick:u=>u.target===u.currentTarget&&e()},f.createElement("div",{className:"modal-header"},f.createElement("button",{onClick:e,className:"btn-secondary",style:{padding:"9px 16px",fontSize:14}},"✕ Cancel"),f.createElement("span",{style:{fontFamily:"var(--serif)",fontSize:19,color:"var(--text)"}},t),f.createElement("button",{onClick:()=>i&&n(),disabled:!i,style:{background:i?l:"var(--surface-high)",border:"none",borderRadius:12,padding:"9px 18px",fontSize:14,fontWeight:700,color:i?"#0C0C10":"var(--text-dim)",cursor:i?"pointer":"not-allowed",fontFamily:"var(--font)",transition:"all 0.2s"}},r)),f.createElement("div",{className:"modal-body"},o))}function re({label:t,hint:e,children:n,required:r}){return f.createElement("div",{style:{marginBottom:18}},f.createElement("label",{style:{fontSize:12,fontWeight:700,color:"var(--text-sec)",textTransform:"uppercase",letterSpacing:.7,marginBottom:8,display:"block"}},t,r&&f.createElement("span",{style:{color:"var(--danger)"}}," *")),n,e&&f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)",marginTop:6}},e))}function oe({style:t,...e}){return f.createElement("input",{className:"input-field",style:t,...e})}function Vi({style:t,...e}){return f.createElement("textarea",{className:"input-field",style:{minHeight:88,resize:"vertical",...t},...e})}function wT({style:t,children:e,...n}){return f.createElement("select",{className:"input-field",style:{cursor:"pointer",...t},...n},e)}function YN({value:t,onChange:e,options:n}){return f.createElement("div",{className:"toggle-switch"},n.map(r=>f.createElement("button",{key:r.value,onClick:()=>e(r.value),className:`toggle-option${t===r.value?" active":""}`},r.label)))}function XN({year:t,month:e,onChange:n}){const r=()=>{let s=e-1,o=t;s<0&&(s=11,o--),n(o,s)},i=()=>{let s=e+1,o=t;s>11&&(s=0,o++),n(o,s)};return f.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},f.createElement("button",{onClick:r,style:{width:32,height:32,borderRadius:10,background:"var(--surface-high)",border:"1px solid var(--border)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"‹"),f.createElement("span",{style:{fontFamily:"var(--serif)",fontSize:16,color:"var(--text)",minWidth:98,textAlign:"center"}},os[e]," ",t),f.createElement("button",{onClick:i,style:{width:32,height:32,borderRadius:10,background:"var(--surface-high)",border:"1px solid var(--border)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"›"))}function Kf({bg:t,shadow:e,onClick:n}){return f.createElement("button",{className:"fab",onClick:n,style:{background:t,boxShadow:`0 4px 24px ${e}`}},"+")}function as({name:t,size:e=40,fontSize:n=14}){return f.createElement("div",{className:"avatar-circle",style:{width:e,height:e,fontSize:n,background:KN(t),color:"#0C0C10"}},QN(t))}function Qf({onDelete:t}){return f.createElement("button",{className:"delete-btn",onClick:t},"✕")}function JN({value:t,onSelect:e,onClose:n}){const[r,i]=J.useState(""),s=GN.filter(o=>o.name.toLowerCase().includes(r.toLowerCase())||o.code.toLowerCase().includes(r.toLowerCase()));return f.createElement(Sn,{title:"Select Currency",onClose:n,onSave:n,saveLabel:"Done"},f.createElement(oe,{placeholder:"🔍  Search currencies…",value:r,onChange:o=>i(o.target.value),style:{marginBottom:16}}),f.createElement("div",{className:"card"},s.map((o,l)=>{const u=(t==null?void 0:t.code)===o.code;return f.createElement("div",{key:o.code,onClick:()=>{e(o)},className:"card-row",style:{cursor:"pointer",background:u?"var(--accent-deep)":"transparent"}},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:14}},f.createElement("span",{style:{fontSize:24}},o.flag),f.createElement("div",null,f.createElement("div",{style:{fontSize:15,fontWeight:600,color:u?"var(--accent)":"var(--text)"}},o.code),f.createElement("div",{style:{fontSize:12,color:"var(--text-sec)"}},o.name))),f.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},f.createElement("span",{style:{fontSize:17,fontWeight:700,color:u?"var(--accent)":"var(--text-dim)"}},o.symbol),u&&f.createElement("div",{style:{width:20,height:20,borderRadius:10,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#0C0C10",fontWeight:800}},"✓")))})))}function xy(t){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)}function ZN(){const{login:t,register:e,forgotPassword:n,resendVerification:r}=vs(),[i,s]=J.useState("login"),[o,l]=J.useState(""),[u,h]=J.useState(""),[p,m]=J.useState(""),[g,_]=J.useState(""),[N,R]=J.useState(!1),[k,I]=J.useState(""),[T,P]=J.useState(""),[b,V]=J.useState("");async function M(){m(""),R(!0);const E=T;function A(x){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)}if(!A(k))return m("Enter valid email."),R(!1);if(E.length<6)return m("Enter valid password."),R(!1);const C=await t(k.trim(),E);C!=null&&C.error&&C.error.includes("verify")&&_("Didn't receive email? Click below to resend."),R(!1)}async function w(){m(""),R(!0);const E=T;if(!u.trim())return m("Enter your full name."),R(!1);if(!xy(k))return m("Enter a valid email address."),R(!1);if(!o||o.length<10)return m("Enter valid phone number."),R(!1);if(E.length<6)return m("Password must be at least 6 characters."),R(!1);if(T!==b)return m("Passwords do not match."),R(!1);const A=await e(u,k.trim(),o,E);A!=null&&A.error&&m(A.error),R(!1)}async function v(){if(m(""),!xy(k)){m("Enter valid email.");return}const E=await n(k);E!=null&&E.error?m(E.error):alert("Password reset email sent!")}return f.createElement("div",{style:{minHeight:"100vh",background:"var(--bg)",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}},f.createElement("div",{style:{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:130,background:"radial-gradient(circle, var(--accent-deep) 0%, transparent 70%)",pointerEvents:"none",opacity:.8}}),f.createElement("div",{style:{position:"absolute",bottom:120,left:-80,width:220,height:220,borderRadius:110,background:"radial-gradient(circle, var(--blue-deep) 0%, transparent 70%)",pointerEvents:"none"}}),f.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"48px 28px 32px",position:"relative",zIndex:1}},f.createElement("div",{style:{marginBottom:44}},f.createElement("div",{style:{fontSize:12,fontWeight:700,color:"var(--accent-text)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}},"Welcome to"),f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:52,color:"var(--text)",lineHeight:1,marginBottom:10}},"Ledger"),f.createElement("div",{style:{fontSize:15,color:"var(--text-sec)",lineHeight:1.6}},i==="login"?"Sign in to your account":i==="register"?"Create a new account":"Reset your passcode")),i==="login"&&f.createElement("div",{className:"fade-in"},f.createElement(re,{label:"Email Address",required:!0},f.createElement(oe,{type:"email",placeholder:"your@email.com",value:k,onChange:E=>I(E.target.value)})),f.createElement(re,{label:"6-Digit Passcode",required:!0},f.createElement(oe,{type:"password",placeholder:"Enter password",value:T,onChange:E=>P(E.target.value)})),p&&f.createElement("p",{style:{color:"var(--danger)",fontSize:14,marginBottom:16,textAlign:"center"}},p),f.createElement("button",{className:"btn-primary",style:{width:"100%",marginBottom:14},onClick:M,disabled:N},N?"Signing in…":"Sign In →"),f.createElement("div",{style:{display:"flex",justifyContent:"space-between"}},f.createElement("button",{onClick:()=>{s("register"),m(""),P([])},style:{background:"none",border:"none",color:"var(--accent-text)",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}},"Create account"),f.createElement("button",{onClick:()=>{s("forgot"),m(""),_("")},style:{background:"none",border:"none",color:"var(--text-sec)",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"var(--font)"}},"Forgot passcode?"))),i==="register"&&f.createElement("div",{className:"fade-in"},f.createElement(re,{label:"Full Name",required:!0},f.createElement(oe,{placeholder:"Your full name",value:u,onChange:E=>h(E.target.value)})),f.createElement(re,{label:"Phone Number",required:!0},f.createElement(oe,{type:"tel",placeholder:"e.g. 9XXXXXXXXX",value:o,onChange:E=>l(E.target.value)})),f.createElement(re,{label:"Email Address",required:!0},f.createElement(oe,{type:"email",placeholder:"your@email.com",value:k,onChange:E=>I(E.target.value)})),f.createElement(re,{label:"Set 6-Digit Passcode",required:!0},f.createElement(oe,{type:"password",placeholder:"Enter password",value:T,onChange:E=>P(E.target.value)})),f.createElement(re,{label:"Confirm Passcode",required:!0},f.createElement(oe,{type:"password",placeholder:"Enter password",value:b,onChange:E=>V(E.target.value)})),p&&f.createElement("p",{style:{color:"var(--danger)",fontSize:14,marginBottom:16,textAlign:"center"}},p),f.createElement("button",{className:"btn-primary",style:{width:"100%",marginBottom:14},onClick:w,disabled:N},N?"Creating account…":"Create Account →"),f.createElement("button",{onClick:()=>{s("login"),m(""),P([]),V([])},style:{background:"none",border:"none",color:"var(--text-sec)",fontSize:14,cursor:"pointer",fontFamily:"var(--font)",width:"100%",textAlign:"center"}},"Already have an account? Sign in")),i==="forgot"&&f.createElement("div",{className:"fade-in"},f.createElement(re,{label:"Registered Email",required:!0},f.createElement(oe,{type:"email",placeholder:"your@email.com",value:k,onChange:E=>I(E.target.value)})),p&&f.createElement("p",{style:{color:"var(--danger)",fontSize:14,marginBottom:16}},p),g&&f.createElement("div",{style:{background:"var(--accent-deep)",border:"1px solid var(--accent)",borderRadius:12,padding:"14px 16px",fontSize:14,color:"var(--accent-text)",marginBottom:16,lineHeight:1.5}},g),f.createElement("button",{className:"btn-primary",style:{width:"100%",marginBottom:14},onClick:v},"Send reset link"),f.createElement("button",{onClick:()=>{s("login"),m(""),_("")},style:{background:"none",border:"none",color:"var(--text-sec)",fontSize:14,cursor:"pointer",fontFamily:"var(--font)",width:"100%",textAlign:"center"}},"← Back to Sign In"))))}const TT=J.createContext();function ex({children:t}){const[e,n]=J.useState(()=>localStorage.getItem("ledger_theme")||"dark");J.useEffect(()=>{document.documentElement.setAttribute("data-theme",e),localStorage.setItem("ledger_theme",e)},[e]);const r=()=>n(i=>i==="dark"?"light":"dark");return f.createElement(TT.Provider,{value:{theme:e,toggle:r}},t)}function IT(){return J.useContext(TT)}const ST=J.createContext();function Wa(){return Math.random().toString(36).slice(2,9)}const Ha={income:[],expenses:[],invoices:[],customers:[],account:null,currency:{code:"INR",symbol:"₹",name:"Indian Rupee",flag:"🇮🇳"}};function tx({children:t}){const{user:e}=vs(),[n,r]=J.useState(Ha),[i,s]=J.useState(!1);async function o(){if(e){try{const b=kr(kn,"users",e.id),V=await Ff(b);if(V.exists()){const M=V.data();r({income:M.income||[],expenses:M.expenses||[],invoices:M.invoices||[],customers:M.customers||[],currency:M.currency||Ha.currency,account:M.account||{name:M.name||"",email:M.email||"",phone:M.phone||"",address:M.address||"",gstin:M.gstin||""}})}else{const M=rg(e.id,"appData");r(M||Ha)}}catch(b){console.log("Firebase error, using local:",b);const V=rg(e.id,"appData");r(V||Ha)}s(!0)}}J.useEffect(()=>{o()},[e==null?void 0:e.id]);const l=J.useCallback(b=>{r(V=>{const M=typeof b=="function"?b(V):{...V,...b};return wS(e.id,"appData",M),Lw(kr(kn,"users",e.id),M),M})},[e==null?void 0:e.id]),u=b=>l(V=>({...V,currency:b})),h=b=>l(V=>({...V,account:b})),p=b=>l(V=>({...V,customers:[...V.customers,{...b,id:Wa()}]})),m=b=>l(V=>({...V,customers:V.customers.map(M=>M.id===b.id?b:M)})),g=b=>l(V=>({...V,customers:V.customers.filter(M=>M.id!==b)})),_=b=>l(V=>({...V,income:[{...b,id:Wa()},...V.income]})),N=b=>l(V=>({...V,income:V.income.filter(M=>M.id!==b)})),R=b=>l(V=>({...V,expenses:[{...b,id:Wa()},...V.expenses]})),k=b=>l(V=>({...V,expenses:V.expenses.filter(M=>M.id!==b)})),I=b=>l(V=>({...V,invoices:[{...b,id:Wa()},...V.invoices]})),T=b=>l(V=>({...V,invoices:V.invoices.map(M=>M.id===b.id?b:M)})),P=b=>l(V=>({...V,invoices:V.invoices.filter(M=>M.id!==b)}));return f.createElement(ST.Provider,{value:{...n,loaded:i,setCurrency:u,saveAccount:h,customers:n.customers,addCustomer:p,updateCustomer:m,removeCustomer:g,income:n.income,addIncome:_,removeIncome:N,expenses:n.expenses,addExpense:R,removeExpense:k,invoices:n.invoices,addInvoice:I,updateInvoice:T,removeInvoice:P}},t)}function aa(){return J.useContext(ST)}function nx({year:t,month:e,onNav:n}){var g;const r=aa(),i=((g=r.currency)==null?void 0:g.symbol)||"₹",s=zu(t,e),o=r.invoices.filter(_=>{var N;return((N=_.date)==null?void 0:N.slice(0,7))===s}).reduce((_,N)=>_+Vt(N.items),0),l=r.income.filter(_=>_.month===s).reduce((_,N)=>_+Number(N.amount),0),u=o+l,h=r.expenses.reduce((_,N)=>N.recurring?N.startMonth<=s?_+Number(N.amount):_:N.month===s?_+Number(N.amount):_,0),p=u-h,m=({label:_,val:N,color:R,deep:k,sub:I,onClick:T})=>f.createElement("div",{onClick:T,style:{background:"var(--surface)",border:`1px solid ${R}33`,borderRadius:18,padding:"18px 16px",cursor:T?"pointer":"default",boxShadow:"var(--card-shadow)"}},f.createElement("div",{style:{fontSize:11,fontWeight:700,color:R,textTransform:"uppercase",letterSpacing:.8,marginBottom:10}},_),f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:22,color:R,letterSpacing:-.5,marginBottom:I?4:0}},N),I&&f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},I));return f.createElement("div",{style:{paddingBottom:20}},f.createElement("div",{className:"section-hero",style:{background:"linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)"}},f.createElement("div",{style:{fontSize:12,fontWeight:700,color:"var(--accent-text)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}},"Net Balance · ",os[e]," ",t),f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:46,color:p>=0?"var(--accent)":"var(--danger)",letterSpacing:-1,lineHeight:1}},p<0?"-":"",ge(p,i)),f.createElement("div",{style:{fontSize:13,color:"var(--text-sec)",marginTop:8}},p>=0?"Positive month 📈":"Deficit — review expenses")),f.createElement("div",{style:{padding:"20px 18px 0"}},f.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}},f.createElement(m,{label:"Total Income",val:ge(u,i),color:"var(--accent)",sub:`${r.invoices.filter(_=>{var N;return((N=_.date)==null?void 0:N.slice(0,7))===s}).length} inv. + manual`,onClick:()=>n("income")}),f.createElement(m,{label:"Expenses",val:ge(h,i),color:"var(--danger)",sub:`${r.expenses.length} total`,onClick:()=>n("expenses")}),f.createElement(m,{label:"Free Balance",val:ge(Math.max(0,p),i),color:"var(--blue)",sub:p<0?"Over budget":"After expenses"})),f.createElement("div",{style:{marginBottom:22}},f.createElement("div",{className:"section-label"},"Income Breakdown"),f.createElement("div",{className:"card"},[["Invoice Income",o,"var(--accent)"],["Manual Income",l,"var(--accent-text)"]].map(([_,N,R],k)=>f.createElement("div",{key:_,className:"card-row"},f.createElement("span",{style:{fontSize:15,color:"var(--text-sec)"}},_),f.createElement("span",{style:{fontSize:16,fontWeight:700,color:R}},ge(N,i)))))),f.createElement("div",null,f.createElement("div",{className:"section-label"},"Recent Invoices"),f.createElement("div",{className:"card"},r.invoices.length===0?f.createElement("div",{style:{padding:"24px",textAlign:"center",fontSize:14,color:"var(--text-dim)"}},"No invoices yet"):r.invoices.slice(0,4).map(_=>{var N,R,k,I;return f.createElement("div",{key:_.id,className:"card-row"},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},f.createElement(as,{name:((N=_.customer)==null?void 0:N.name)||((R=_.billTo)==null?void 0:R.name)||"?",size:36,fontSize:13}),f.createElement("div",null,f.createElement("div",{style:{fontSize:14,fontWeight:600,color:"var(--text)"}},((k=_.customer)==null?void 0:k.name)||((I=_.billTo)==null?void 0:I.name)),f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},_.number))),f.createElement("span",{style:{fontSize:15,fontWeight:700,color:"var(--blue)"}},ge(Vt(_.items),i)))})))))}function rx({year:t,month:e}){var N;const n=aa(),r=((N=n.currency)==null?void 0:N.symbol)||"₹",i=zu(t,e),[s,o]=J.useState(!1),[l,u]=J.useState({label:"",amount:"",date:`${t}-${String(e+1).padStart(2,"0")}-01`,note:""}),h=n.invoices.filter(R=>{var k;return((k=R.date)==null?void 0:k.slice(0,7))===i}),p=n.income.filter(R=>R.month===i),m=h.reduce((R,k)=>R+Vt(k.items),0),g=p.reduce((R,k)=>R+Number(k.amount),0);function _(){n.addIncome({label:l.label,amount:Number(l.amount),date:l.date,month:i,note:l.note}),u({label:"",amount:"",date:`${t}-${String(e+1).padStart(2,"0")}-01`,note:""}),o(!1)}return f.createElement("div",{style:{paddingBottom:100}},f.createElement("div",{className:"section-hero",style:{background:"linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)"}},f.createElement("div",{style:{fontSize:12,fontWeight:700,color:"var(--accent-text)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}},"Total Income · ",os[e]," ",t),f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:42,color:"var(--accent)",letterSpacing:-.5}},ge(m+g,r))),f.createElement("div",{style:{padding:"22px 18px 0"}},f.createElement("div",{className:"section-label",style:{display:"flex",justifyContent:"space-between"}},f.createElement("span",null,"From Invoices"),f.createElement("span",{style:{color:"var(--accent)"}},ge(m,r))),f.createElement("div",{className:"card",style:{marginBottom:22}},h.length===0?f.createElement("div",{style:{padding:"20px",textAlign:"center",fontSize:14,color:"var(--text-dim)"}},"No invoices this month"):h.map(R=>{var k,I,T;return f.createElement("div",{key:R.id,className:"card-row"},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},f.createElement(as,{name:((k=R.customer)==null?void 0:k.name)||"?",size:34,fontSize:12}),f.createElement("div",null,f.createElement("div",{style:{fontSize:14,fontWeight:600,color:"var(--text)"}},((I=R.customer)==null?void 0:I.name)||((T=R.billTo)==null?void 0:T.name)),f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},R.number," · ",_r(R.date)))),f.createElement("span",{style:{fontSize:15,fontWeight:700,color:"var(--accent)"}},ge(Vt(R.items),r)))})),f.createElement("div",{className:"section-label",style:{display:"flex",justifyContent:"space-between"}},f.createElement("span",null,"Manual Income"),f.createElement("span",{style:{color:"var(--accent)"}},ge(g,r))),f.createElement("div",{className:"card"},p.length===0?f.createElement("div",{style:{padding:"20px",textAlign:"center",fontSize:14,color:"var(--text-dim)"}},"No manual income — tap + to add"):p.map(R=>f.createElement("div",{key:R.id,className:"card-row"},f.createElement("div",null,f.createElement("div",{style:{fontSize:15,fontWeight:600,color:"var(--text)"}},R.label),f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},_r(R.date),R.note?` · ${R.note}`:"")),f.createElement("div",{style:{display:"flex",gap:10,alignItems:"center"}},f.createElement("span",{style:{fontSize:15,fontWeight:700,color:"var(--accent)"}},ge(R.amount,r)),f.createElement(Qf,{onDelete:()=>n.removeIncome(R.id)})))))),f.createElement(Kf,{bg:"var(--accent)",shadow:"rgba(126,232,162,0.35)",onClick:()=>o(!0)}),s&&f.createElement(Sn,{title:"Add Income",onClose:()=>o(!1),onSave:_,canSave:!!l.label.trim()&&!!l.amount},f.createElement(re,{label:"Description",required:!0},f.createElement(oe,{placeholder:"e.g. Consulting Fee",value:l.label,onChange:R=>u(k=>({...k,label:R.target.value}))})),f.createElement(re,{label:`Amount (${r})`,required:!0},f.createElement(oe,{type:"number",placeholder:"0.00",value:l.amount,onChange:R=>u(k=>({...k,amount:R.target.value}))})),f.createElement(re,{label:"Date Received",required:!0},f.createElement(oe,{type:"date",value:l.date,onChange:R=>u(k=>({...k,date:R.target.value}))})),f.createElement(re,{label:"Note (optional)"},f.createElement(oe,{placeholder:"Any additional info",value:l.note,onChange:R=>u(k=>({...k,note:R.target.value}))}))))}const ix=["Operations","Tools","Marketing","Payroll","Utilities","Travel","Other"];function sx({year:t,month:e}){var R;const n=aa(),r=((R=n.currency)==null?void 0:R.symbol)||"₹",i=zu(t,e),[s,o]=J.useState(!1),[l,u]=J.useState({label:"",amount:"",category:"Operations",recurring:!1,date:`${t}-${String(e+1).padStart(2,"0")}-01`,note:""}),h=n.expenses.filter(k=>k.recurring?k.startMonth<=i:k.month===i),p=h.reduce((k,I)=>k+Number(I.amount),0),m=h.filter(k=>k.recurring),g=h.filter(k=>!k.recurring);function _(){const k={label:l.label,amount:Number(l.amount),category:l.category,note:l.note,date:l.date};l.recurring?(k.recurring=!0,k.startMonth=i):(k.recurring=!1,k.month=i),n.addExpense(k),u({label:"",amount:"",category:"Operations",recurring:!1,date:`${t}-${String(e+1).padStart(2,"0")}-01`,note:""}),o(!1)}const N=({e:k})=>f.createElement("div",{className:"card-row"},f.createElement("div",{style:{flex:1,minWidth:0}},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:3}},f.createElement("span",{style:{fontSize:15,fontWeight:600,color:"var(--text)"}},k.label),k.recurring&&f.createElement("span",{className:"pill",style:{background:"var(--blue-deep)",color:"var(--blue)"}},"Recurring")),f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},k.category,k.date?` · ${_r(k.date)}`:"")),f.createElement("div",{style:{display:"flex",gap:10,alignItems:"center",flexShrink:0}},f.createElement("span",{style:{fontSize:15,fontWeight:700,color:"var(--danger)"}},ge(k.amount,r)),f.createElement(Qf,{onDelete:()=>n.removeExpense(k.id)})));return f.createElement("div",{style:{paddingBottom:100}},f.createElement("div",{className:"section-hero",style:{background:"linear-gradient(145deg, var(--danger-deep) 0%, var(--bg) 60%)"}},f.createElement("div",{style:{fontSize:12,fontWeight:700,color:"var(--danger)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}},"Total Expenses · ",os[e]," ",t),f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:42,color:"var(--danger)",letterSpacing:-.5}},ge(p,r))),f.createElement("div",{style:{padding:"22px 18px 0"}},m.length>0&&f.createElement(f.Fragment,null,f.createElement("div",{className:"section-label",style:{display:"flex",justifyContent:"space-between"}},f.createElement("span",null,"Recurring"),f.createElement("span",{style:{color:"var(--danger)"}},ge(m.reduce((k,I)=>k+Number(I.amount),0),r))),f.createElement("div",{className:"card",style:{marginBottom:22}},m.map(k=>f.createElement(N,{key:k.id,e:k})))),f.createElement("div",{className:"section-label",style:{display:"flex",justifyContent:"space-between"}},f.createElement("span",null,"One-Time"),f.createElement("span",{style:{color:"var(--danger)"}},ge(g.reduce((k,I)=>k+Number(I.amount),0),r))),f.createElement("div",{className:"card"},g.length===0?f.createElement("div",{style:{padding:"20px",textAlign:"center",fontSize:14,color:"var(--text-dim)"}},"No one-time expenses this month"):g.map(k=>f.createElement(N,{key:k.id,e:k})))),f.createElement(Kf,{bg:"var(--danger)",shadow:"rgba(255,110,110,0.35)",onClick:()=>o(!0)}),s&&f.createElement(Sn,{title:"Add Expense",onClose:()=>o(!1),onSave:_,canSave:!!l.label.trim()&&!!l.amount,accentColor:"var(--danger)"},f.createElement(re,{label:"Description",required:!0},f.createElement(oe,{placeholder:"e.g. Office Rent",value:l.label,onChange:k=>u(I=>({...I,label:k.target.value}))})),f.createElement(re,{label:`Amount (${r})`,required:!0},f.createElement(oe,{type:"number",placeholder:"0.00",value:l.amount,onChange:k=>u(I=>({...I,amount:k.target.value}))})),f.createElement(re,{label:"Category"},f.createElement(wT,{value:l.category,onChange:k=>u(I=>({...I,category:k.target.value}))},ix.map(k=>f.createElement("option",{key:k},k)))),f.createElement(re,{label:"Date",required:!0},f.createElement(oe,{type:"date",value:l.date,onChange:k=>u(I=>({...I,date:k.target.value}))})),f.createElement(re,{label:"Type"},f.createElement(YN,{value:l.recurring?"recurring":"once",onChange:k=>u(I=>({...I,recurring:k==="recurring"})),options:[{value:"once",label:"One-Time"},{value:"recurring",label:"Recurring Monthly"}]})),l.recurring&&f.createElement("div",{style:{background:"var(--blue-deep)",border:"1px solid var(--blue)33",borderRadius:12,padding:"12px 14px",fontSize:13,color:"var(--blue)",marginBottom:16}},"Applies every month from ",os[e]," ",t," onward."),f.createElement(re,{label:"Note (optional)"},f.createElement(oe,{placeholder:"Any note",value:l.note,onChange:k=>u(I=>({...I,note:k.target.value}))}))))}function ox(t,e,n){var g,_,N,R,k,I,T,P,b,V,M,w;const r=Vt(t.items),i=t.items.reduce((v,E)=>{const C=(Number(E.qty)||0)*(Number(E.rate)||0)*(Number(E.igst)||0)/100;return v+C},0),s=r,o=r+i,l=e||{},u=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #111; padding: 40px; font-size: 13px; }
  .page { max-width: 800px; margin: 0 auto; }
  
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #111; }
  .biz-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .biz-details { font-size: 12px; color: #555; line-height: 1.7; }
  .gstin { font-weight: 700; color: #111; }
  
  .inv-title { font-size: 26px; font-weight: 800; letter-spacing: 1px; text-align: right; margin-bottom: 8px; }
  .inv-meta { text-align: right; font-size: 12px; color: #555; line-height: 1.7; }
  .inv-num { font-size: 14px; font-weight: 700; color: #111; }
  
  .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .addr-block { padding: 16px; background: #f8f8f8; border-radius: 6px; }
  .addr-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #999; margin-bottom: 8px; }
  .addr-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .addr-details { font-size: 12px; color: #555; line-height: 1.7; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead { background: #111; color: #fff; }
  th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
  th.ar, td.ar { text-align: right; }
  td { padding: 12px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
  .item-desc { font-weight: 600; }
  .item-sub { font-size: 11px; color: #888; margin-top: 2px; }
  
  .totals-section { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .totals-table { width: 300px; }
  .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid #eee; }
  .totals-row.grand { border-top: 2px solid #111; border-bottom: none; padding-top: 12px; font-size: 16px; font-weight: 800; }
  
  .notes-section { margin-bottom: 24px; }
  .notes-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #999; margin-bottom: 8px; }
  .notes-box { background: #f8f8f8; border-radius: 6px; padding: 14px; font-size: 13px; color: #555; line-height: 1.6; }
  
  .terms { font-size: 12px; color: #777; line-height: 1.7; border-top: 1px solid #eee; padding-top: 20px; }
  .terms-title { font-weight: 700; color: #555; margin-bottom: 4px; }
  
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #bbb; border-top: 1px solid #eee; padding-top: 20px; }
  
  @media print {
    body { padding: 20px; }
    @page { margin: 15mm; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="biz-name">${l.name||"Your Business"}</div>
      <div class="biz-details">
        ${l.address?l.address.replace(/\n/g,"<br>"):""}
        ${l.gstin?`<br><span class="gstin">GSTIN: ${l.gstin}</span>`:""}
        ${l.phone?`<br>${l.phone}`:""}
        ${l.email?`<br>${l.email}`:""}
      </div>
    </div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="inv-meta">
        <div class="inv-num">Invoice Number: ${t.number}</div>
        <div>Date: ${_r(t.date)}</div>
        ${t.dueDate?`<div>Due Date: ${_r(t.dueDate)}</div>`:""}
      </div>
    </div>
  </div>

  <!-- Addresses -->
  <div class="addresses">
    <div class="addr-block">
      <div class="addr-label">Bill To</div>
      <div class="addr-name">${((g=t.billTo)==null?void 0:g.name)||((_=t.customer)==null?void 0:_.name)||"—"}</div>
      <div class="addr-details">
        ${(((N=t.billTo)==null?void 0:N.address)||((R=t.customer)==null?void 0:R.address)||"").replace(/\n/g,"<br>")}
        ${(k=t.billTo)!=null&&k.gstin||(I=t.customer)!=null&&I.gstin?`<br><strong>GSTIN:</strong> ${((T=t.billTo)==null?void 0:T.gstin)||((P=t.customer)==null?void 0:P.gstin)}`:""}
      </div>
    </div>
    <div class="addr-block">
      <div class="addr-label">Ship To</div>
      <div class="addr-name">${((b=t.shipTo)==null?void 0:b.name)||((V=t.customer)==null?void 0:V.name)||"—"}</div>
      <div class="addr-details">
        ${(((M=t.shipTo)==null?void 0:M.address)||((w=t.customer)==null?void 0:w.address)||"").replace(/\n/g,"<br>")}
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item &amp; Description</th>
        ${l.showHSN!==!1?"<th>HSN/SAC</th>":""}
        <th class="ar">Qty</th>
        <th class="ar">Rate</th>
        <th class="ar">IGST</th>
        <th class="ar">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${t.items.map((v,E)=>{const A=(Number(v.qty)||0)*(Number(v.rate)||0);return`<tr>
          <td>${E+1}</td>
          <td><div class="item-desc">${v.desc||"—"}</div>${v.subDesc?`<div class="item-sub">${v.subDesc}</div>`:""}</td>
          ${l.showHSN!==!1?`<td>${v.hsn||""}</td>`:""}
          <td class="ar">${v.qty}</td>
          <td class="ar">${n}${Number(v.rate||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
          <td class="ar">${Number(v.igst||0).toFixed(2)}%</td>
          <td class="ar">${n}${A.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
        </tr>`}).join("")}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-table">
      <div class="totals-row"><span>Taxable Value</span><span>${n}${s.toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
      <div class="totals-row"><span>IGST</span><span>${n}${i.toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
      <div class="totals-row grand"><span>Total</span><span>${n}${o.toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
    </div>
  </div>

  ${t.notes?`<div class="notes-section"><div class="notes-label">Notes</div><div class="notes-box">${t.notes}</div></div>`:""}

  ${t.terms?`<div class="terms"><div class="terms-title">Terms &amp; Conditions</div>${t.terms}</div>`:""}

  <div class="footer">Thank you for your business.</div>
</div>
</body>
</html>`,h=new Blob([u],{type:"text/html"}),p=URL.createObjectURL(h),m=document.createElement("a");m.href=p,m.download=`${t.number}.html`,m.click(),URL.revokeObjectURL(p)}function ax({year:t,month:e}){var w,v,E,A,C,x,S;const n=aa(),r=((w=n.currency)==null?void 0:w.symbol)||"₹",i=zu(t,e),[s,o]=J.useState(!1),[l,u]=J.useState(null),[h,p]=J.useState(null),m=()=>({number:`INV-${String(n.invoices.length+1).padStart(3,"0")}`,customerId:"",billTo:{name:"",address:"",gstin:""},shipTo:{name:"",address:""},shipSameAsBill:!0,date:`${t}-${String(e+1).padStart(2,"0")}-01`,dueDate:"",items:[{id:Ny(),desc:"",subDesc:"",hsn:"",qty:1,rate:"",igst:0}],notes:"Thanks for your business.",terms:"Supply meant for export under LUT without payment of IGST. Place of Supply: Outside India"}),[g,_]=J.useState(null),N=n.invoices.filter(L=>{var q;return((q=L.date)==null?void 0:q.slice(0,7))===i}),R=N.reduce((L,q)=>L+Vt(q.items),0);function k(){_(m()),u(null),o(!0)}function I(L){_({...L,items:L.items.map(q=>({...q})),shipSameAsBill:L.shipSameAsBill??!0}),u(L),p(null),o(!0)}function T(){if(!g)return;const L=n.customers.find(se=>se.id===g.customerId),q={...g,customer:L,billTo:g.customerId&&L?{name:L.name,address:L.address,gstin:L.gstin}:g.billTo,shipTo:g.shipSameAsBill?g.customerId&&L?{name:L.name,address:L.address}:g.billTo:g.shipTo};l?n.updateInvoice(q):n.addInvoice(q),o(!1),_(null),u(null)}function P(){_(L=>({...L,items:[...L.items,{id:Ny(),desc:"",subDesc:"",hsn:"",qty:1,rate:"",igst:0}]}))}function b(L){_(q=>({...q,items:q.items.filter(se=>se.id!==L)}))}function V(L,q,se){_(et=>({...et,items:et.items.map(j=>j.id===L?{...j,[q]:se}:j)}))}function M(L){const q=n.customers.find(se=>se.id===L);_(se=>({...se,customerId:L,billTo:q?{name:q.name,address:q.address,gstin:q.gstin}:se.billTo,shipTo:q?{name:q.name,address:q.address}:se.shipTo}))}return f.createElement("div",{style:{paddingBottom:100}},f.createElement("div",{className:"section-hero",style:{background:"linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)"}},f.createElement("div",{style:{fontSize:12,fontWeight:700,color:"var(--blue)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}},"Invoice Total · ",os[e]," ",t),f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:42,color:"var(--blue)",letterSpacing:-.5}},ge(R,r)),f.createElement("div",{style:{fontSize:13,color:"var(--text-sec)",marginTop:6}},N.length," invoice(s)")),f.createElement("div",{style:{padding:"22px 18px 0"}},f.createElement("div",{className:"card"},N.length===0?f.createElement("div",{style:{padding:"40px 24px",textAlign:"center"}},f.createElement("div",{style:{fontSize:48,marginBottom:14}},"📄"),f.createElement("div",{style:{fontSize:16,fontWeight:700,color:"var(--text-sec)"}},"No invoices this month")):N.map((L,q)=>{var se,et,j,Q;return f.createElement("div",{key:L.id,className:"card-row",onClick:()=>p(L),style:{cursor:"pointer"}},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},f.createElement(as,{name:((se=L.customer)==null?void 0:se.name)||((et=L.billTo)==null?void 0:et.name)||"?",size:40,fontSize:14}),f.createElement("div",null,f.createElement("div",{style:{fontSize:15,fontWeight:600,color:"var(--text)"}},((j=L.customer)==null?void 0:j.name)||((Q=L.billTo)==null?void 0:Q.name)||"—"),f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},L.number," · ",_r(L.date)))),f.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},f.createElement("span",{style:{fontSize:15,fontWeight:700,color:"var(--blue)"}},ge(Vt(L.items),r)),f.createElement("span",{style:{color:"var(--text-dim)",fontSize:18}},"›")))}))),f.createElement(Kf,{bg:"var(--blue)",shadow:"rgba(103,178,255,0.35)",onClick:k}),h&&(()=>{var se,et,j,Q,X;const L=n.invoices.find(z=>z.id===h.id)||h,q=L.items.reduce((z,W)=>z+(Number(W.qty)||0)*(Number(W.rate)||0)*(Number(W.igst)||0)/100,0);return f.createElement(Sn,{title:L.number,onClose:()=>p(null),onSave:()=>I(L),saveLabel:"Edit",accentColor:"var(--blue)"},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:14,marginBottom:22}},f.createElement(as,{name:((se=L.customer)==null?void 0:se.name)||((et=L.billTo)==null?void 0:et.name)||"?",size:52,fontSize:20}),f.createElement("div",null,f.createElement("div",{style:{fontSize:20,fontWeight:700,color:"var(--text)"}},((j=L.customer)==null?void 0:j.name)||((Q=L.billTo)==null?void 0:Q.name)),f.createElement("div",{style:{fontSize:13,color:"var(--text-dim)"}},((X=L.customer)==null?void 0:X.email)||""))),f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:40,color:"var(--blue)",marginBottom:4}},ge(Vt(L.items)+q,r)),f.createElement("div",{style:{fontSize:13,color:"var(--text-sec)",marginBottom:22}},"Issued ",_r(L.date),L.dueDate?` · Due ${_r(L.dueDate)}`:""),f.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}},[["Bill To",L.billTo],["Ship To",L.shipTo]].map(([z,W])=>f.createElement("div",{key:z,style:{background:"var(--surface-high)",borderRadius:12,padding:"12px 14px"}},f.createElement("div",{style:{fontSize:11,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.8,marginBottom:6}},z),f.createElement("div",{style:{fontSize:14,fontWeight:600,color:"var(--text)"}},(W==null?void 0:W.name)||"—"),f.createElement("div",{style:{fontSize:12,color:"var(--text-sec)",marginTop:2,lineHeight:1.6}},((W==null?void 0:W.address)||"").replace(/\n/g,", ")),(W==null?void 0:W.gstin)&&f.createElement("div",{style:{fontSize:11,color:"var(--text-dim)",marginTop:2}},"GSTIN: ",W.gstin)))),f.createElement("div",{className:"card",style:{marginBottom:16}},L.items.map((z,W,Se)=>f.createElement("div",{key:z.id,className:"card-row"},f.createElement("div",{style:{flex:1}},f.createElement("div",{style:{fontSize:15,fontWeight:500,color:"var(--text)"}},z.desc||"Item"),z.subDesc&&f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},z.subDesc),f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)",marginTop:2}},z.hsn&&`HSN: ${z.hsn} · `,z.qty," × ",ge(z.rate,r)," · IGST ",z.igst||0,"%")),f.createElement("span",{style:{fontSize:14,fontWeight:700,color:"var(--text)"}},ge((Number(z.qty)||0)*(Number(z.rate)||0),r)))),f.createElement("div",{style:{padding:"12px 18px",borderTop:"1px solid var(--border)",fontSize:13,color:"var(--text-sec)"}},f.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4}},f.createElement("span",null,"Taxable Value"),f.createElement("span",null,ge(Vt(L.items),r))),f.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:8}},f.createElement("span",null,"IGST"),f.createElement("span",null,ge(q,r))),f.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:17,color:"var(--text)"}},f.createElement("span",null,"Total"),f.createElement("span",{style:{color:"var(--blue)"}},ge(Vt(L.items)+q,r))))),L.notes&&f.createElement("div",{className:"card",style:{padding:"14px 18px",fontSize:14,color:"var(--text-sec)",marginBottom:14,lineHeight:1.6}},f.createElement("strong",{style:{color:"var(--text)"}},"Notes:")," ",L.notes),L.terms&&f.createElement("div",{className:"card",style:{padding:"14px 18px",fontSize:13,color:"var(--text-sec)",marginBottom:20,lineHeight:1.6}},f.createElement("strong",{style:{color:"var(--text)"}},"Terms:")," ",L.terms),f.createElement("div",{style:{display:"flex",gap:12}},f.createElement("button",{onClick:()=>ox(L,n.account,r),style:{flex:2,border:"none",borderRadius:14,padding:"15px",fontFamily:"var(--font)",fontSize:15,fontWeight:700,cursor:"pointer",background:"var(--blue)",color:"#fff"}},"⬇ Download"),f.createElement("button",{onClick:()=>{window.confirm("Delete this invoice?")&&(n.removeInvoice(L.id),p(null))},style:{flex:1,border:"1px solid var(--danger)44",borderRadius:14,padding:"15px",fontFamily:"var(--font)",fontSize:15,fontWeight:600,cursor:"pointer",background:"var(--danger-deep)",color:"var(--danger)"}},"Delete")))})(),s&&g&&f.createElement(Sn,{title:l?"Edit Invoice":"New Invoice",onClose:()=>{o(!1),_(null),u(null)},onSave:T,canSave:!!(g.customerId||(v=g.billTo)!=null&&v.name),accentColor:"var(--blue)"},f.createElement(re,{label:"Invoice Number"},f.createElement(oe,{value:g.number,onChange:L=>_(q=>({...q,number:L.target.value}))})),f.createElement(re,{label:"Customer",hint:"Select from your customers list"},f.createElement(wT,{value:g.customerId,onChange:L=>M(L.target.value)},f.createElement("option",{value:""},"— Select customer —"),n.customers.map(L=>f.createElement("option",{key:L.id,value:L.id},L.name)))),!g.customerId&&f.createElement(f.Fragment,null,f.createElement("div",{style:{fontSize:13,color:"var(--text-sec)",marginBottom:14,padding:"10px 14px",background:"var(--surface-high)",borderRadius:10}},"Or enter bill-to details manually:"),f.createElement(re,{label:"Bill To — Name"},f.createElement(oe,{placeholder:"Client / Company",value:((E=g.billTo)==null?void 0:E.name)||"",onChange:L=>_(q=>({...q,billTo:{...q.billTo,name:L.target.value}}))})),f.createElement(re,{label:"Bill To — Address"},f.createElement(Vi,{placeholder:"Full address",value:((A=g.billTo)==null?void 0:A.address)||"",onChange:L=>_(q=>({...q,billTo:{...q.billTo,address:L.target.value}}))})),f.createElement(re,{label:"Bill To — GSTIN (optional)"},f.createElement(oe,{placeholder:"GSTIN",value:((C=g.billTo)==null?void 0:C.gstin)||"",onChange:L=>_(q=>({...q,billTo:{...q.billTo,gstin:L.target.value}}))}))),f.createElement(re,{label:"Ship To"},f.createElement("div",{style:{display:"flex",gap:10,marginBottom:12}},f.createElement("button",{onClick:()=>_(L=>({...L,shipSameAsBill:!0})),style:{flex:1,border:"none",borderRadius:10,padding:"10px",fontFamily:"var(--font)",fontSize:13,fontWeight:600,cursor:"pointer",background:g.shipSameAsBill?"var(--blue-deep)":"var(--surface-high)",color:g.shipSameAsBill?"var(--blue)":"var(--text-sec)"}},"Same as Bill To"),f.createElement("button",{onClick:()=>_(L=>({...L,shipSameAsBill:!1})),style:{flex:1,border:"none",borderRadius:10,padding:"10px",fontFamily:"var(--font)",fontSize:13,fontWeight:600,cursor:"pointer",background:g.shipSameAsBill?"var(--surface-high)":"var(--blue-deep)",color:g.shipSameAsBill?"var(--text-sec)":"var(--blue)"}},"Different Address")),!g.shipSameAsBill&&f.createElement(f.Fragment,null,f.createElement(oe,{placeholder:"Name",value:((x=g.shipTo)==null?void 0:x.name)||"",onChange:L=>_(q=>({...q,shipTo:{...q.shipTo,name:L.target.value}})),style:{marginBottom:10}}),f.createElement(Vi,{placeholder:"Ship-to address",value:((S=g.shipTo)==null?void 0:S.address)||"",onChange:L=>_(q=>({...q,shipTo:{...q.shipTo,address:L.target.value}}))}))),f.createElement(re,{label:"Invoice Date"},f.createElement(oe,{type:"date",value:g.date,onChange:L=>_(q=>({...q,date:L.target.value}))})),f.createElement(re,{label:"Due Date (optional)"},f.createElement(oe,{type:"date",value:g.dueDate||"",onChange:L=>_(q=>({...q,dueDate:L.target.value}))})),f.createElement("label",{style:{fontSize:12,fontWeight:700,color:"var(--text-sec)",textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:10}},"Line Items"),g.items.map((L,q)=>f.createElement("div",{key:L.id,className:"card",style:{marginBottom:12,padding:"16px"}},f.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}},f.createElement("span",{style:{fontSize:13,fontWeight:700,color:"var(--text-sec)"}},"Item ",q+1),g.items.length>1&&f.createElement("button",{onClick:()=>b(L.id),style:{background:"var(--danger-deep)",border:"none",borderRadius:8,color:"var(--danger)",fontSize:12,fontWeight:600,padding:"4px 10px",cursor:"pointer",fontFamily:"var(--font)"}},"Remove")),f.createElement(oe,{placeholder:"Description (e.g. Cyber Security Services)",value:L.desc,onChange:se=>V(L.id,"desc",se.target.value),style:{marginBottom:8}}),f.createElement(oe,{placeholder:"Sub-description (optional)",value:L.subDesc||"",onChange:se=>V(L.id,"subDesc",se.target.value),style:{marginBottom:8,fontSize:14}}),f.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}},f.createElement("div",null,f.createElement("label",{style:{fontSize:11,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",display:"block",marginBottom:4}},"HSN/SAC"),f.createElement(oe,{placeholder:"998314",value:L.hsn||"",onChange:se=>V(L.id,"hsn",se.target.value)})),f.createElement("div",null,f.createElement("label",{style:{fontSize:11,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",display:"block",marginBottom:4}},"IGST %"),f.createElement(oe,{type:"number",placeholder:"0",value:L.igst||"",onChange:se=>V(L.id,"igst",se.target.value)}))),f.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},f.createElement("div",null,f.createElement("label",{style:{fontSize:11,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",display:"block",marginBottom:4}},"Qty"),f.createElement(oe,{type:"number",min:"1",value:L.qty,onChange:se=>V(L.id,"qty",se.target.value)})),f.createElement("div",null,f.createElement("label",{style:{fontSize:11,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",display:"block",marginBottom:4}},"Rate (",r,")"),f.createElement(oe,{type:"number",placeholder:"0.00",value:L.rate,onChange:se=>V(L.id,"rate",se.target.value)}))),f.createElement("div",{style:{textAlign:"right",marginTop:10,fontSize:16,fontWeight:700,color:"var(--blue)"}},ge((Number(L.qty)||0)*(Number(L.rate)||0),r)))),f.createElement("button",{onClick:P,style:{width:"100%",border:"1px solid var(--blue)44",borderRadius:13,padding:"13px",fontFamily:"var(--font)",fontSize:15,fontWeight:600,cursor:"pointer",background:"var(--blue-deep)",color:"var(--blue)",marginBottom:16}},"+ Add Line Item"),f.createElement("div",{className:"card",style:{padding:"14px 18px",marginBottom:16}},f.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:14,color:"var(--text-sec)"}},f.createElement("span",null,"Taxable Value"),f.createElement("span",null,ge(Vt(g.items),r))),f.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:17,color:"var(--text)",marginTop:8,paddingTop:8,borderTop:"1px solid var(--border)"}},f.createElement("span",null,"Total"),f.createElement("span",{style:{color:"var(--blue)"}},ge(Vt(g.items),r)))),f.createElement(re,{label:"Notes"},f.createElement(Vi,{placeholder:"e.g. Thanks for your business.",value:g.notes||"",onChange:L=>_(q=>({...q,notes:L.target.value}))})),f.createElement(re,{label:"Terms & Conditions"},f.createElement(Vi,{placeholder:"e.g. Supply meant for export under LUT…",value:g.terms||"",onChange:L=>_(q=>({...q,terms:L.target.value}))}))))}function lx(t){const e=`ledgerApp_v1_user_${t}_appData`,n=localStorage.getItem(e);if(!n){alert("No data found to export.");return}const r=new Blob([n],{type:"application/json"}),i=URL.createObjectURL(r),s=document.createElement("a");s.href=i,s.download=`ledger-backup-${t}-${Date.now()}.json`,s.click(),URL.revokeObjectURL(i)}function ux(t,e,n){const r=new FileReader;r.onload=function(i){try{const s=JSON.parse(i.target.result),o=`ledgerApp_v1_user_${t}_appData`;localStorage.setItem(o,JSON.stringify(s)),alert("Backup restored successfully!"),n&&n()}catch{alert("Invalid backup file.")}},r.readAsText(e)}function cx(){const{user:t,logout:e,updateProfile:n,setUser:r}=vs(),{account:i,saveAccount:s,currency:o,setCurrency:l,customers:u,addCustomer:h,updateCustomer:p,removeCustomer:m}=aa(),{theme:g,toggle:_}=IT(),[N,R]=J.useState("main"),[k,I]=J.useState(null),[T,P]=J.useState(null),[b,V]=J.useState(i||{name:"",address:"",gstin:"",phone:"",email:"",showHSN:!0}),[M,w]=J.useState({current:["","","","","",""],next:["","","","","",""],confirm:["","","","","",""]}),[v,E]=J.useState(""),[A,C]=J.useState(!1);J.useEffect(()=>{(async()=>{if(t!=null&&t.id)try{const W=await Ff(kr(kn,"users",t.id));if(W.exists()){const Se=W.data();V({name:Se.name||"",email:Se.email||"",phone:Se.phone||"",address:Se.address||"",gstin:Se.gstin||"",showHSN:Se.showHSN||!1})}}catch(W){console.error("LOAD PROFILE ERROR:",W)}})()},[t]);const x=async()=>{try{if(!(t!=null&&t.id)){alert("User not loaded");return}await Mw(kr(kn,"users",t.id),{name:b.name||"",email:b.email||"",phone:b.phone||"",address:b.address||"",gstin:b.gstin||"",showHSN:b.showHSN||!1}),r(z=>({...z,...b})),alert("Profile updated successfully")}catch(z){console.error("SAVE ERROR:",z),alert("Failed to update profile")}};function S(){I({name:"",email:"",phone:"",address:"",gstin:""}),P(null),R("customer-form")}function L(z){I({...z}),P(z),R("customer-form")}function q(){k!=null&&k.name.trim()&&(T?p({...k,id:T.id}):h(k),R("customers"))}function se({arr:z,setArr:W,prefix:Se}){function tt(ht,ve){var _s,la;const vt=ht.target.value.replace(/\D/g,"").slice(-1),di=[...z];di[ve]=vt,W(di),vt&&ve<5&&((_s=document.getElementById(`${Se}-${ve+1}`))==null||_s.focus()),!vt&&ht.nativeEvent.inputType==="deleteContentBackward"&&ve>0&&((la=document.getElementById(`${Se}-${ve-1}`))==null||la.focus())}return f.createElement("div",{style:{display:"flex",gap:8,justifyContent:"center"}},z.map((ht,ve)=>f.createElement("input",{key:ve,id:`${Se}-${ve}`,type:"password",inputMode:"numeric",maxLength:1,value:ht,onChange:vt=>tt(vt,ve),className:"otp-box",style:{borderColor:ht?"var(--accent)":void 0}})))}function et(){E("");const z=M.current.join(""),W=M.next.join(""),Se=M.confirm.join("");if(z!==t.passcode){E("Current passcode is incorrect.");return}if(W.length<6){E("New passcode must be 6 digits.");return}if(W!==Se){E("New passcodes don't match.");return}n({passcode:W}),w({current:["","","","","",""],next:["","","","","",""],confirm:["","","","","",""]}),alert("Passcode updated successfully!"),R("main")}function j(){lx(t.id)}function Q(z){const W=z.target.files[0];W&&window.confirm("This will overwrite your current data. Continue?")&&ux(t.id,W,()=>{window.location.reload()})}const X=({icon:z,label:W,sub:Se,onClick:tt,color:ht,danger:ve})=>f.createElement("div",{onClick:tt,className:"card-row",style:{cursor:"pointer"}},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},f.createElement("div",{style:{width:36,height:36,borderRadius:10,background:ve?"var(--danger-deep)":ht||"var(--surface-high)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}},z),f.createElement("div",null,f.createElement("div",{style:{fontSize:15,fontWeight:600,color:ve?"var(--danger)":"var(--text)"}},W),Se&&f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},Se))),!ve&&f.createElement("span",{style:{color:"var(--text-dim)",fontSize:18}},"›"));if(N==="main")return f.createElement("div",{style:{padding:"20px 18px",paddingBottom:100}},f.createElement("div",{className:"card",style:{padding:"20px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:14}},f.createElement(as,{name:(t==null?void 0:t.name)||"?",size:52,fontSize:20}),f.createElement("div",null,f.createElement("div",{style:{fontSize:18,fontWeight:700,color:"var(--text)"}},t==null?void 0:t.name),f.createElement("div",{style:{fontSize:13,color:"var(--text-sec)"}},t==null?void 0:t.phone))),f.createElement("div",{style:{marginBottom:10}},f.createElement("div",{className:"section-label"},"Business"),f.createElement("div",{className:"card"},f.createElement(X,{icon:"🏢",label:"Account Profile",sub:(i==null?void 0:i.name)||"Set up your business details",onClick:()=>R("account")}),f.createElement(X,{icon:"👥",label:"Customers",sub:`${u.length} customer(s)`,onClick:()=>R("customers")}),f.createElement(X,{icon:"💱",label:"Currency",sub:`${o==null?void 0:o.flag} ${o==null?void 0:o.code} — ${o==null?void 0:o.symbol}`,onClick:()=>C(!0)}))),f.createElement("div",{style:{marginBottom:10,marginTop:20}},f.createElement("div",{className:"section-label"},"Preferences"),f.createElement("div",{className:"card"},f.createElement("div",{className:"card-row"},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},f.createElement("div",{style:{width:36,height:36,borderRadius:10,background:"var(--surface-high)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}},g==="dark"?"🌙":"☀️"),f.createElement("span",{style:{fontSize:15,fontWeight:600,color:"var(--text)"}},g==="dark"?"Dark Mode":"Light Mode")),f.createElement("button",{className:"theme-toggle",onClick:_})),f.createElement(X,{icon:"🔑",label:"Change Passcode",onClick:()=>{w({current:["","","","","",""],next:["","","","","",""],confirm:["","","","","",""]}),E(""),R("passcode")}}))),f.createElement("div",{style:{marginTop:20}},f.createElement("div",{className:"card"},f.createElement(X,{icon:"🚪",label:"Sign Out",danger:!0,onClick:()=>{window.confirm("Sign out?")&&e()}}))),f.createElement("div",{className:"card"},f.createElement("div",{className:"card-row",onClick:j,style:{cursor:"pointer"}},f.createElement("span",null,"📤 Export Backup")),f.createElement("div",{className:"card-row",style:{cursor:"pointer"}},f.createElement("label",{style:{cursor:"pointer",width:"100%"}},"📥 Import Backup",f.createElement("input",{type:"file",accept:"application/json",onChange:Q,style:{display:"none"}})))),A&&f.createElement(JN,{value:o,onSelect:z=>{l(z),C(!1)},onClose:()=>C(!1)}));if(N==="account")return f.createElement(Sn,{title:"Account Profile",onClose:()=>R("main"),onSave:x,canSave:!!b.name.trim()},f.createElement(re,{label:"Business Name",required:!0},f.createElement(oe,{placeholder:"e.g. Type to Enter",value:b.name||"",onChange:z=>V(W=>({...W,name:z.target.value}))})),f.createElement(re,{label:"Address"},f.createElement(Vi,{placeholder:"Full address including state, PIN",value:b.address||"",onChange:z=>V(W=>({...W,address:z.target.value}))})),f.createElement(re,{label:"GSTIN"},f.createElement(oe,{placeholder:"e.g. 36XXXXXXXXXXXXX",value:b.gstin||"",onChange:z=>V(W=>({...W,gstin:z.target.value}))})),f.createElement(re,{label:"Phone"},f.createElement(oe,{type:"tel",placeholder:"+91-9391559067",value:b.phone||"",onChange:z=>V(W=>({...W,phone:z.target.value}))})),f.createElement(re,{label:"Email"},f.createElement(oe,{type:"email",placeholder:"email@example.com",value:b.email||"",onChange:z=>V(W=>({...W,email:z.target.value}))})),f.createElement(re,{label:"Show HSN/SAC on Invoices"},f.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"var(--surface-high)",borderRadius:12}},f.createElement("span",{style:{fontSize:15,color:"var(--text)"}},"Include HSN/SAC column"),f.createElement("button",{onClick:()=>V(z=>({...z,showHSN:!z.showHSN})),style:{width:48,height:28,borderRadius:14,border:"none",cursor:"pointer",position:"relative",transition:"background 0.3s",background:b.showHSN?"var(--accent)":"var(--border)"}},f.createElement("div",{style:{position:"absolute",top:3,left:b.showHSN?void 0:3,right:b.showHSN?3:void 0,width:22,height:22,borderRadius:11,background:"#fff",transition:"all 0.3s"}})))));if(N==="customers")return f.createElement(Sn,{title:"Customers",onClose:()=>R("main"),onSave:S,saveLabel:"+ Add"},u.length===0?f.createElement("div",{style:{textAlign:"center",padding:"40px 0"}},f.createElement("div",{style:{fontSize:48,marginBottom:14}},"👥"),f.createElement("div",{style:{fontSize:16,fontWeight:600,color:"var(--text-sec)"}},"No customers yet")):f.createElement("div",{className:"card"},u.map(z=>f.createElement("div",{key:z.id,className:"card-row"},f.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1},onClick:()=>L(z)},f.createElement(as,{name:z.name,size:38,fontSize:13}),f.createElement("div",null,f.createElement("div",{style:{fontSize:15,fontWeight:600,color:"var(--text)"}},z.name),f.createElement("div",{style:{fontSize:12,color:"var(--text-dim)"}},z.email||z.phone||(z.gstin?`GSTIN: ${z.gstin}`:"No contact")))),f.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},f.createElement("button",{onClick:()=>L(z),style:{background:"var(--blue-deep)",border:"none",borderRadius:9,color:"var(--blue)",fontSize:12,fontWeight:600,padding:"5px 10px",cursor:"pointer",fontFamily:"var(--font)"}},"Edit"),f.createElement(Qf,{onDelete:()=>{window.confirm(`Remove ${z.name}?`)&&m(z.id)}}))))));if(N==="customer-form")return f.createElement(Sn,{title:T?"Edit Customer":"New Customer",onClose:()=>R("customers"),onSave:q,canSave:!!(k!=null&&k.name.trim())},f.createElement(re,{label:"Name",required:!0},f.createElement(oe,{placeholder:"Client / Company name",value:(k==null?void 0:k.name)||"",onChange:z=>I(W=>({...W,name:z.target.value}))})),f.createElement(re,{label:"Email"},f.createElement(oe,{type:"email",placeholder:"billing@company.com",value:(k==null?void 0:k.email)||"",onChange:z=>I(W=>({...W,email:z.target.value}))})),f.createElement(re,{label:"Phone"},f.createElement(oe,{type:"tel",placeholder:"+1 555 000 0000",value:(k==null?void 0:k.phone)||"",onChange:z=>I(W=>({...W,phone:z.target.value}))})),f.createElement(re,{label:"Address"},f.createElement(Vi,{placeholder:"Full billing address",value:(k==null?void 0:k.address)||"",onChange:z=>I(W=>({...W,address:z.target.value}))})),f.createElement(re,{label:"GSTIN (optional)"},f.createElement(oe,{placeholder:"e.g. 36XXXXXXXXXX",value:(k==null?void 0:k.gstin)||"",onChange:z=>I(W=>({...W,gstin:z.target.value}))})));if(N==="passcode")return f.createElement(Sn,{title:"Change Passcode",onClose:()=>R("main"),onSave:et,canSave:!0},f.createElement(re,{label:"Current Passcode"},f.createElement(se,{arr:M.current,setArr:z=>w(W=>({...W,current:z})),prefix:"cur"})),f.createElement(re,{label:"New Passcode"},f.createElement(se,{arr:M.next,setArr:z=>w(W=>({...W,next:z})),prefix:"nxt"})),f.createElement(re,{label:"Confirm New Passcode"},f.createElement(se,{arr:M.confirm,setArr:z=>w(W=>({...W,confirm:z})),prefix:"cnf"})),v&&f.createElement("p",{style:{color:"var(--danger)",fontSize:14,marginTop:8,textAlign:"center"}},v))}function hx(){const{user:t}=vs(),[e,n]=J.useState([]);if((t==null?void 0:t.role)!=="admin")return f.createElement("div",{style:{padding:20}},"Access Denied");async function r(){const l=(await Sk(uk(kn,"users"))).docs.map(u=>({id:u.id,...u.data()}));n(l)}J.useEffect(()=>{r()},[]);const i=async(o,l)=>{if(o===t.id){alert("You cannot block your own account.");return}await Mw(kr(kn,"users",o),{blocked:!l}),r()},s=async o=>{if(o===t.id){alert("You cannot delete your own admin account.");return}window.confirm("Are you sure you want to delete this user?")&&(await Ak(kr(kn,"users",o)),r())};return f.createElement("div",{style:{padding:20}},f.createElement("h2",null,"Admin Panel"),e.map(o=>f.createElement("div",{key:o.id,style:{border:"1px solid #ddd",padding:12,marginBottom:10,borderRadius:8}},f.createElement("div",null,f.createElement("b",null,o.name)),f.createElement("div",null,o.email),f.createElement("div",null,o.phone),f.createElement("div",null,"Status: ",o.blocked?"Blocked ❌":"Active ✅"),o.id!==t.id&&f.createElement(f.Fragment,null,f.createElement("button",{onClick:()=>i(o.id,o.blocked)},o.blocked?"Unblock":"Block"),f.createElement("button",{onClick:()=>s(o.id),style:{marginLeft:10,color:"red"}},"Delete")))))}const by=new Date;function dx(){var g;const{user:t}=vs(),{theme:e,toggle:n}=IT(),[r,i]=J.useState("dashboard"),[s,o]=J.useState(by.getFullYear()),[l,u]=J.useState(by.getMonth()),h=[{id:"dashboard",icon:"⊞",label:"Home"},{id:"income",icon:"↑",label:"Income"},{id:"expenses",icon:"↓",label:"Expenses"},{id:"invoices",icon:"◻",label:"Invoices"},{id:"settings",icon:"⚙",label:"Settings"},...(t==null?void 0:t.role)==="admin"?[{id:"admin",icon:"🛡",label:"Admin"}]:[]],p={dashboard:"var(--accent)",income:"var(--accent)",expenses:"var(--danger)",invoices:"var(--blue)",settings:"var(--purple)",admin:"var(--purple)"},m=p[r];return f.createElement("div",{style:{background:"var(--bg)",minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative"}},f.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px 0",fontSize:13,fontWeight:700}},f.createElement("span",{style:{color:"var(--text)"}},new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})),f.createElement("span",{style:{fontFamily:"var(--serif)",fontSize:15,color:m,letterSpacing:.5}},"Ledger"),f.createElement("button",{className:"theme-toggle",onClick:n,title:`Switch to ${e==="dark"?"light":"dark"} mode`})),f.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 18px 12px",borderBottom:"1px solid var(--border)"}},f.createElement("div",{style:{fontFamily:"var(--serif)",fontSize:26,color:"var(--text)"}},(g=h.find(_=>_.id===r))==null?void 0:g.label),r!=="settings"&&f.createElement(XN,{year:s,month:l,onChange:(_,N)=>{o(_),u(N)}}),r==="settings"&&f.createElement("span",{style:{fontSize:13,color:"var(--text-sec)",maxWidth:140,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},t==null?void 0:t.name)),f.createElement("div",{className:"content-scroll"},r==="dashboard"&&f.createElement(nx,{year:s,month:l,onNav:i}),r==="income"&&f.createElement(rx,{year:s,month:l}),r==="expenses"&&f.createElement(sx,{year:s,month:l}),r==="invoices"&&f.createElement(ax,{year:s,month:l}),r==="settings"&&f.createElement(cx,null),r==="admin"&&f.createElement(hx,null)),f.createElement("div",{className:"tab-bar"},h.map(_=>{const N=r===_.id,R=p[_.id];return f.createElement("button",{key:_.id,className:"tab-btn",onClick:()=>i(_.id)},f.createElement("span",{style:{fontSize:18,color:N?R:"var(--text-dim)",transition:"color 0.2s"}},_.icon),f.createElement("span",{style:{fontSize:9,fontWeight:700,color:N?R:"var(--text-dim)",letterSpacing:.4,textTransform:"uppercase"}},_.label),N&&f.createElement("div",{style:{width:16,height:2,borderRadius:1,background:R}}))})))}function fx(){const{user:t,loading:e}=vs();return e?f.createElement("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)"}},f.createElement("div",{className:"spinner"})):t?t.blocked?f.createElement("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:24}},f.createElement("div",{style:{textAlign:"center",maxWidth:320}},f.createElement("div",{style:{fontSize:48,marginBottom:16}},"🚫"),f.createElement("h2",{style:{color:"var(--text)",fontFamily:"var(--serif)",fontSize:28,marginBottom:8}},"Account Blocked"),f.createElement("p",{style:{color:"var(--text-sec)",fontSize:15,lineHeight:1.6,marginBottom:24}},"Your account has been blocked by the administrator. Please contact support."),f.createElement("button",{onClick:()=>{localStorage.clear(),window.location.reload()},style:{background:"var(--danger)",color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}},"Sign Out"))):f.createElement(tx,null,f.createElement(dx,null)):f.createElement(ZN,null)}function px(){return f.createElement(ex,null,f.createElement(HN,null,f.createElement(fx,null)))}$_(document.getElementById("root")).render(f.createElement(J.StrictMode,null,f.createElement(px,null)));
