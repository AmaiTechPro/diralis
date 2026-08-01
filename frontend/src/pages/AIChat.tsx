import {
  useEffect,
  useRef,
  useState,
} from "react";

import { sendMessage } from "../services/chatService";

import {
  getChatSessions,
} from "../services/chatHistoryService";

import {
  Bot,
  User,
  Send,
} from "lucide-react";


type ChatMessage = {
  sender: "user" | "ai";
  text: string;
  time: string;
};


type ChatSession = {
  id: string;
  title: string;
};



export default function AIChat() {


  const [messages, setMessages] =
    useState<ChatMessage[]>([
      {
        sender: "ai",
        text:
          "Hello 👋 I'm the Diralis AI Assistant. Ask me anything about your latest uploaded dataset.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);



  const [input, setInput] =
    useState("");



  const [loading, setLoading] =
    useState(false);



  const [sessions, setSessions] =
    useState<ChatSession[]>([]);



  const bottomRef =
    useRef<HTMLDivElement>(null);



  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, loading]);





  useEffect(() => {

    async function loadSessions(){

      try {

        const data =
          await getChatSessions();

        setSessions(data);

      } catch(error){

        console.error(
          "Failed to load chat sessions",
          error
        );

      }

    }


    loadSessions();

  }, []);






  async function handleSend(
    question?: string
  ) {


    const message =
      question ?? input;



    if(!message.trim()) return;



    setMessages((prev)=>[
      ...prev,
      {
        sender:"user",
        text:message,
        time:new Date().toLocaleTimeString([],{
          hour:"2-digit",
          minute:"2-digit",
        }),
      },
    ]);



    setInput("");

    setLoading(true);



    try {


      const response =
        await sendMessage(message);



      setMessages((prev)=>[
        ...prev,
        {
          sender:"ai",
          text:response.reply,
          time:new Date().toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit",
          }),
        },
      ]);



    } catch(error){


      console.error(error);


      setMessages((prev)=>[
        ...prev,
        {
          sender:"ai",
          text:
            "Sorry, I couldn't process your request.",
          time:new Date().toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit",
          }),
        },
      ]);


    }


    setLoading(false);

  }





  const prompts = [

    "Summarize my dataset",

    "Business health",

    "Show AI insights",

    "Show warnings",

    "Show recommendations",

  ];






  return (

    <div>


      <h1 className="text-4xl font-bold">
        AI Chat
      </h1>


      <p className="mt-3 text-slate-400">
        Chat with your business data.
      </p>





      <div className="mt-6 flex flex-wrap gap-3">


        {prompts.map((prompt)=>(

          <button

            key={prompt}

            onClick={() =>
              handleSend(prompt)
            }

            className="rounded-full border border-cyan-500 px-4 py-2 text-sm text-cyan-400 transition hover:bg-cyan-500 hover:text-black"

          >

            {prompt}

          </button>

        ))}


      </div>





      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">



        <div className="h-[500px] overflow-y-auto space-y-5 p-6">


          {messages.map((message,index)=>(


            <div

              key={index}

              className={`flex gap-3 ${
                message.sender==="user"
                ?"justify-end"
                :"justify-start"
              }`}

            >



              {message.sender==="ai" && (

                <Bot
                  className="mt-1 text-cyan-400"
                  size={22}
                />

              )}



              <div

                className={`max-w-[70%] rounded-xl px-4 py-3 ${
                  message.sender==="user"
                  ?"bg-cyan-500 text-black"
                  :"bg-slate-800 text-white"
                }`}

              >

                <p className="whitespace-pre-line">

                  {message.text}

                </p>



                <p className="mt-2 text-right text-xs opacity-60">

                  {message.time}

                </p>


              </div>





              {message.sender==="user" && (

                <User
                  className="mt-1 text-cyan-400"
                  size={22}
                />

              )}


            </div>


          ))}





          {loading && (

            <div className="flex gap-3">


              <Bot
                className="text-cyan-400"
                size={22}
              />


              <div className="rounded-xl bg-slate-800 px-4 py-3 animate-pulse">

                Thinking...

              </div>


            </div>

          )}



          <div ref={bottomRef}/>


        </div>






        <div className="flex gap-3 border-t border-slate-800 p-5">


          <input

            value={input}

            onChange={(e)=>
              setInput(e.target.value)
            }


            onKeyDown={(e)=>{

              if(e.key==="Enter"){

                handleSend();

              }

            }}


            placeholder="Ask about your dataset..."


            className="flex-1 rounded-lg bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"

          />





          <button

            onClick={() =>
              handleSend()
            }

            disabled={loading}

            className="rounded-lg bg-cyan-500 px-5 text-black transition hover:bg-cyan-400 disabled:opacity-50"

          >

            <Send size={20}/>

          </button>



        </div>



      </div>



    </div>

  );

}

