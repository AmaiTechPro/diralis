import { useEffect, useState } from "react";

export default function useCountUp(
  end: number,
  duration: number = 2000
) {

  const [count, setCount] = useState(0);


  useEffect(() => {

    let start = 0;

    const startTime = performance.now();


    const update = (currentTime: number) => {

      const elapsed = currentTime - startTime;

      const progress = Math.min(
        elapsed / duration,
        1
      );


      const value =
        start +
        (end - start) * progress;


      setCount(
        Number(value.toFixed(1))
      );


      if (progress < 1) {

        requestAnimationFrame(update);

      } else {

        setCount(end);

      }

    };


    requestAnimationFrame(update);


  }, [end, duration]);


  return count;

}


