import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";


export default function ThemeToggle(){

const {theme,setTheme}=useTheme();

const [mounted,setMounted]=useState(false);


useEffect(()=>{

setMounted(true);

},[]);


if(!mounted)
return null;


return (

<button

onClick={()=>{

setTheme(
theme==="dark"
?
"light"
:
"dark"
);

}}

className="
rounded-xl
border
border-slate-700
p-2
hover:border-cyan-400
transition
"

>

{
theme==="dark"
?
<Sun size={18}/>
:
<Moon size={18}/>
}

</button>

);

}

