
{/* eslint-disable @typescript-eslint/no-unused-vars }

const API = "http://localhost:5000/api";


export async function downloadReport(
  section: string = "full"
) {

  const response = await fetch(
    `${API}/reports/generate/${section}`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to generate report"
    );
  }


  const blob = await response.blob();


  const url =
    window.URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;


  link.download =
    `Diralis_${section}_Report.pdf`;


  document.body.appendChild(link);


  link.click();


  link.remove();


  window.URL.revokeObjectURL(url);

}   */}


{/* eslint-disable @typescript-eslint/no-unused-vars */}

const API = "http://localhost:5000/api";


export async function downloadReport(
  section: string = "full"
) {

  const response = await fetch(
    `${API}/reports/generate/${section}`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to generate report"
    );
  }


  const blob = await response.blob();


  const url =
    window.URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;


  link.download =
    `Diralis_${section}_Report.pdf`;


  document.body.appendChild(link);


  link.click();


  link.remove();


  window.URL.revokeObjectURL(url);

}