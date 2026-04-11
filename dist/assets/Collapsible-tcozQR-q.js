import{r as f,R as e}from"./index-DLlDMF9r.js";function u({title:s,count:a,defaultOpen:o=!1,children:l,icon:i="📋",color:c="var(--text)",onToggle:n}){const[r,d]=f.useState(o),m=()=>{d(!r),n==null||n(!r)};return e.createElement("div",{style:{marginBottom:10}},e.createElement("button",{onClick:m,style:{width:"100%",background:"var(--surface-high)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"var(--font)",fontWeight:600,fontSize:14,color:"var(--text)",transition:"all 0.2s"},onMouseEnter:t=>{t.currentTarget.style.background="var(--surface)",t.currentTarget.style.borderColor=c},onMouseLeave:t=>{t.currentTarget.style.background="var(--surface-high)",t.currentTarget.style.borderColor="var(--border)"}},e.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},e.createElement("span",{style:{fontSize:16}},i),e.createElement("div",{style:{textAlign:"left"}},e.createElement("div",null,s),a!==void 0&&e.createElement("div",{style:{fontSize:11,color:"var(--text-dim)",fontWeight:400,marginTop:2}},a," item",a!==1?"s":""))),e.createElement("span",{style:{fontSize:16,transition:"transform 0.2s",transform:r?"rotate(180deg)":"rotate(0deg)"}},"▼")),r&&e.createElement("div",{style:{marginTop:8,animation:"slideDown 0.2s ease-out"}},l),e.createElement("style",null,`
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
      `))}export{u as C};
