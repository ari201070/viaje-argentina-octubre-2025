import cities from "./data/cities.json"

const colors={
blue:"#0B5ED7",
light:"#F5F7FA",
card:"#FFFFFF",
text:"#1F2937"
}

export default function App(){

return(

<div style={{background:colors.light,minHeight:"100vh",fontFamily:"Segoe UI,Arial"}}>

<header style={{
background:"linear-gradient(135deg,#0B5ED7,#38BDF8)",
color:"white",
padding:"60px 40px"
}}>

<div style={{maxWidth:"1400px",margin:"auto"}}>

<h1 style={{fontSize:56,margin:0}}>
🇦🇷 Argentina
</h1>

<h2 style={{fontWeight:400}}>
Aventura Familiar de 30 Días
</h2>

<p>
28 Septiembre · 2 Noviembre 2025
</p>

</div>

</header>

<main style={{
maxWidth:"1400px",
margin:"40px auto",
padding:"20px"
}}>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",
gap:"25px"
}}>

{cities.map(city=>(

<div
key={city.id}
style={{
background:colors.card,
borderRadius:"18px",
overflow:"hidden",
boxShadow:"0 8px 20px rgba(0,0,0,.12)"
}}
>

<div style={{
height:"180px",
background:"linear-gradient(135deg,#90CAF9,#1976D2)"
}}>

</div>

<div style={{padding:"25px"}}>

<h2>{city.name}</h2>

<p><b>Fechas:</b> {city.days||"A definir"}</p>

<div style={{
display:"flex",
gap:"10px",
flexWrap:"wrap",
marginTop:"20px"
}}>

<button>📍 Actividades</button>
<button>🍴 Restaurantes</button>
<button>🏨 Hotel</button>
<button>🗺️ Mapa</button>

</div>

</div>

</div>

))}

</div>

<section style={{
marginTop:"40px",
background:"white",
padding:"30px",
borderRadius:"18px",
boxShadow:"0 8px 20px rgba(0,0,0,.12)"
}}>

<h2>Roadmap</h2>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:"20px"
}}>

<div>✅ Arquitectura</div>
<div>🟡 OpenStreetMap</div>
<div>🟡 Wikiloc</div>
<div>🟡 Diario</div>
<div>🟡 Fotos</div>
<div>🟡 Presupuesto</div>
<div>🟡 IA Local</div>
<div>🟡 Offline</div>

</div>

</section>

</main>

</div>

)

}
