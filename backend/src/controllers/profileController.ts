import { Request, Response } from "express";

import prisma from "../config/prisma";

import { profileDataset } from "../services/profiler/profileDataset";

import { parseDataset } from "../services/parser/parseDataset";



export async function getDatasetProfile(
  req: Request,
  res: Response
) {

  try {

    const { id } = req.params;



    const dataset =
      await prisma.dataset.findUnique({
        where:{
          id
        }
      });



    if(!dataset){

      return res.status(404).json({
        message:"Dataset not found"
      });

    }



    const rows =
      await parseDataset(
        dataset.filePath
      );



    const profile =
      profileDataset(rows);



    return res.json({

      dataset:{
        id:dataset.id,
        name:dataset.name
      },


      profile

    });


  } catch(error){


    console.error(error);


    return res.status(500).json({
      message:"Failed to generate profile"
    });


  }

}

