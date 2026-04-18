import{j as e}from"./index-BTLtm-u4.js";import{r as p}from"./react-vendor-KfUPlHYY.js";function y({title:n,count:s,defaultOpen:i=!1,children:o,icon:l="📋",color:d="var(--text)",onToggle:a}){const[r,c]=p.useState(i),f=()=>{c(!r),a==null||a(!r)};return e.jsxs("div",{style:{marginBottom:10},children:[e.jsxs("button",{onClick:f,style:{width:"100%",background:"var(--surface-high)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"var(--font)",fontWeight:600,fontSize:14,color:"var(--text)",transition:"all 0.2s"},onMouseEnter:t=>{t.currentTarget.style.background="var(--surface)",t.currentTarget.style.borderColor=d},onMouseLeave:t=>{t.currentTarget.style.background="var(--surface-high)",t.currentTarget.style.borderColor="var(--border)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx("span",{style:{fontSize:16},children:l}),e.jsxs("div",{style:{textAlign:"left"},children:[e.jsx("div",{children:n}),s!==void 0&&e.jsxs("div",{style:{fontSize:11,color:"var(--text-dim)",fontWeight:400,marginTop:2},children:[s," item",s!==1?"s":""]})]})]}),e.jsx("span",{style:{fontSize:16,transition:"transform 0.2s",transform:r?"rotate(180deg)":"rotate(0deg)"},children:"▼"})]}),r&&e.jsx("div",{style:{marginTop:8,animation:"slideDown 0.2s ease-out"},children:o}),e.jsx("style",{children:`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `})]})}export{y as C};
