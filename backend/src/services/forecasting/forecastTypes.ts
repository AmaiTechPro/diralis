export interface ForecastResult {


 available:boolean;


 confidence:
 "HIGH" |
 "MEDIUM" |
 "LOW";


 message:string;


 trend?:string;


 predictedValues?:number[];

}

