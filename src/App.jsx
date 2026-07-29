import cities from "./data/cities.json"

export default function App(){

return(

<div style={{
minHeight:"100vh",
background:"#eef3f8",
fontFamily:"Segoe UI,Arial,sans-serif"
}}>

<header style={{
background:"linear-gradient(135deg,#0057b8,#0099ff)",
color:"white",
padding:"60px 40px"
}}>

<div style={{
maxWidth:"1300px",
margin:"auto"
}}>

<h1 style={{
fontSize:"48px",
margin:0
}}>
🇦🇷 Argentina
</h1>

<h2 style={{
fontWeight:"400",
marginTop:"10px"
}}>
Aventura Familiar · Octubre 2025
</h2>

<div style={{
display:"flex",
gap:"15px",
flexWrap:"wrap",
marginTop:"35px"
}}>

<button>🏠 Inicio</button>
<button>🗺 Itinerario</button>
<button>📖 Diario</button>
<button>📸 Fotos</button>
<button>🥾 Wikiloc</button>
<button>🌎 Mapa</button>

</div>

</div>

</header>

<main style={{
maxWidth:"1300px",
margin:"40px auto",
display:"grid",
gridTemplateColumns:"3fr 1fr",
gap:"25px",
padding:"0 20px"
}}>

<section>

<div style={{
background:"white",
borderRadius:"15px",
padding:"25px",
boxShadow:"0 5px 15px rgba(0,0,0,.08)"
}}>

<h2>🗺 Itinerario</h2>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",
gap:"18px",
marginTop:"25px"
}}>

{cities.map(city=>(

<div
key={city.id}
style={{
border:"1px solid #ddd",
borderRadius:"12px",
padding:"20px",
background:"#fafafa"
}}
>

<h3>{city.name}</h3>

<p>{city.days||"Próximamente"}</p>

<button>Ver ciudad</button>

</div>

))}

</div>

</div>

</section>

<aside>

<div style={{
background:"white",
padding:"20px",
borderRadius:"15px",
marginBottom:"20px",
boxShadow:"0 5px 15px rgba(0,0,0,.08)"
}}>

<h2>📊 Proyecto</h2>

<p>Versión 0.1.0</p>
<p>Sprint 3</p>
<p>React + Vite</p>
<p>OpenStreetMap</p>
<p>GitHub Flow</p>

</div>

<div style={{
background:"white",
padding:"20px",
borderRadius:"15px",
boxShadow:"0 5px 15px rgba(0,0,0,.08)"
}}>

<h2>🚀 Próximos módulos</h2>

<ul>

<li>Timeline</li>
<li>Mapa</li>
<li>Galería</li>
<li>Restaurantes</li>
<li>Hoteles</li>
<li>Actividades</li>
<li>Presupuesto</li>
<li>IA</li>

</ul>

</div>

</aside>

</main>

<footer style={{
textAlign:"center",
padding:"35px",
color:"#666"
}}>

Version 0.1.0 · Sprint 3

</footer>

</div>

)

}
