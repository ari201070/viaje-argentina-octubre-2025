import cities from "./data/cities.json"

const trip = {
  title: "Argentina · Aventura Familiar de 30 Días",
  subtitle: "Viaje realizado · Octubre 2025",
  travelers: "2 adultos + 2 hijos",
  duration: "30 días"
}

export default function App(){

return(

<div style={{
background:"#f4f6f8",
minHeight:"100vh",
padding:"40px",
fontFamily:"Segoe UI,Arial,sans-serif"
}}>

<div style={{
maxWidth:"1200px",
margin:"auto"
}}>

<header style={{
background:"#1565c0",
color:"white",
padding:"35px",
borderRadius:"18px",
boxShadow:"0 8px 25px rgba(0,0,0,.15)"
}}>

<h1 style={{margin:0}}>
🇦🇷 {trip.title}
</h1>

<p>{trip.subtitle}</p>

<div style={{
display:"flex",
gap:"20px",
flexWrap:"wrap",
marginTop:"20px"
}}>

<div>👨‍👩‍👧‍👦 {trip.travelers}</div>
<div>🗓 {trip.duration}</div>
<div>🌎 Open Source</div>

</div>

</header>

<div style={{
display:"grid",
gridTemplateColumns:"2fr 1fr",
gap:"25px",
marginTop:"30px"
}}>

<section>

<h2>Itinerario</h2>

{cities.map(city=>(

<div
key={city.id}
style={{
background:"white",
padding:"18px",
marginBottom:"15px",
borderRadius:"12px",
boxShadow:"0 3px 10px rgba(0,0,0,.08)",
transition:".3s"
}}
>

<h3 style={{marginBottom:"5px"}}>

📍 {city.name}

</h3>

<p>{city.days||"Próximamente"}</p>

</div>

))}

</section>

<aside>

<div style={{
background:"white",
padding:"20px",
borderRadius:"12px",
boxShadow:"0 3px 10px rgba(0,0,0,.08)",
marginBottom:"20px"
}}>

<h2>Estado</h2>

<p>🟢 React</p>
<p>🟢 GitHub</p>
<p>🟢 Develop</p>
<p>🟢 Arquitectura</p>

</div>

<div style={{
background:"white",
padding:"20px",
borderRadius:"12px",
boxShadow:"0 3px 10px rgba(0,0,0,.08)"
}}>

<h2>Roadmap</h2>

<p>⬜ OpenStreetMap</p>
<p>⬜ Wikiloc</p>
<p>⬜ Diario</p>
<p>⬜ Fotos</p>
<p>⬜ Timeline</p>
<p>⬜ Traducciones</p>
<p>⬜ IA Local</p>

</div>

</aside>

</div>

<footer style={{
marginTop:"50px",
textAlign:"center",
color:"#666"
}}>

Version 0.0.3 · Sprint 2

</footer>

</div>

</div>

)

}
