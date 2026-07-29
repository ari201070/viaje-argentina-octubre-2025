import cities from "./data/cities.json"

export default function App(){

return(

<div style={{
maxWidth:"1100px",
margin:"40px auto",
fontFamily:"Arial"
}}>

<h1>🇦🇷 Argentina - Aventura Familiar de 30 Días</h1>

<p>
Proyecto Open Source del viaje realizado en Octubre 2025.
</p>

<hr/>

<h2>Itinerario</h2>

{cities.map(city=>(
<div
key={city.id}
style={{
border:"1px solid #ddd",
borderRadius:"8px",
padding:"15px",
marginBottom:"12px"
}}
>
<h3>{city.name}</h3>
<p>{city.days}</p>
</div>
))}

<hr/>

<h2>Roadmap</h2>

<ul>
<li>✅ Arquitectura</li>
<li>🔜 OpenStreetMap</li>
<li>🔜 Wikiloc</li>
<li>🔜 Diario</li>
<li>🔜 Fotos</li>
<li>🔜 IA</li>
<li>🔜 Traducciones</li>
</ul>

</div>

)

}
