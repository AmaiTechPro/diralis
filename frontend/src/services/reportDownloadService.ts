export async function downloadReport(
  section: string,
  datasetId?: string
) {

  let url =
    `${import.meta.env.VITE_API_URL}/reports/generate/${section}`


  if(datasetId){
    url += `?datasetId=${datasetId}`;
  }


  const token =
    localStorage.getItem("token");


  const response =
    await fetch(
      url,
      {
        headers:{
          Authorization:
          `Bearer ${token}`
        }
      }
    );


  if(!response.ok){

    throw new Error(
      "Failed to generate report"
    );

  }


  const blob =
    await response.blob();


  const downloadUrl =
    window.URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    downloadUrl;


  link.download =
    `Diralis_${section}_Report.pdf`;


  document.body.appendChild(link);


  link.click();


  link.remove();


  window.URL.revokeObjectURL(
    downloadUrl
  );

}

