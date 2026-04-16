import{r as o}from"./index-CjfPojb0.js";function n(e,t=300){const[u,r]=o.useState(e);return o.useEffect(()=>{const s=setTimeout(()=>{r(e)},t);return()=>{clearTimeout(s)}},[e,t]),u}export{n as u};
