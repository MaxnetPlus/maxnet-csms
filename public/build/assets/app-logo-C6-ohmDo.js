import{J as a,r,j as s,u as i}from"./app-DydvzzJZ.js";import{a as o}from"./createLucideIcon-B8g3hsTz.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],l=o("Monitor",c);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],d=o("Moon",p);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],m=o("Sun",u);function x(){const{props:n}=a(),t=n.csrf_token;return r.useEffect(()=>{const e=document.querySelector('meta[name="csrf-token"]');e&&t&&(e.content=t)},[t]),t}function g({children:n}){return x(),s.jsx(s.Fragment,{children:n})}function k(){const{appearance:n,updateAppearance:t}=i();return s.jsx("div",{className:"inline-flex w-full items-center rounded-lg border border-input bg-background p-0.5 group-data-[collapsible=icon]:hidden",children:["light","dark","system"].map(e=>s.jsxs("button",{onClick:()=>t(e),className:`inline-flex min-w-0 flex-1 items-center justify-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${n===e?"bg-primary text-primary-foreground shadow-sm":"hover:bg-muted hover:text-muted-foreground"}`,title:`Switch to ${e} mode`,children:[e==="light"&&s.jsx(m,{className:"h-3 w-3 flex-shrink-0"}),e==="dark"&&s.jsx(d,{className:"h-3 w-3 flex-shrink-0"}),e==="system"&&s.jsx(l,{className:"h-3 w-3 flex-shrink-0"}),s.jsx("span",{className:"ml-1 truncate text-[10px]",children:e==="system"?"Sys":e.charAt(0).toUpperCase()+e.slice(1)})]},e))})}function y({className:n="",normalLogoClassName:t="",collapsedLogoClassName:e=""}){return s.jsxs("div",{className:`flex w-full items-center justify-center ${n}`,children:[s.jsx("img",{src:"/assets/logo.png",alt:"App Logo",className:`mx-auto h-8 w-auto flex-shrink-0 group-data-[collapsible=icon]:hidden ${t}`}),s.jsx("img",{src:"/assets/logo-collapsible.png",alt:"App Logo",className:`mx-auto hidden h-8 w-auto flex-shrink-0 group-data-[collapsible=icon]:block ${e}`})]})}export{y as A,g as C,d as M,m as S,k as T,l as a};
