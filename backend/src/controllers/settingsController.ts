import { Request, Response } from "express";
import prisma from "../lib/prisma";



export async function getSettings(
  req: Request,
  res: Response
) {

  try {

    const userId =
      (req as any).user.userId;


    const settings =
      await prisma.user.findUnique({

        where:{
          id:userId,
        },

        select:{
          theme:true,
          notifications:true,
        },

      });


    res.json(settings);


  } catch(error){

    console.error(error);

    res.status(500).json({
      message:"Failed to load settings",
    });

  }

}





export async function updateSettings(
  req: Request,
  res: Response
){

  try {


    const userId =
      (req as any).user.userId;


    const {
      theme,
      notifications,
    } = req.body;



    const updated =
      await prisma.user.update({

        where:{
          id:userId,
        },

        data:{
          theme,
          notifications,
        },

        select:{
          theme:true,
          notifications:true,
        },

      });



    res.json(updated);


  } catch(error){

    console.error(error);

    res.status(500).json({
      message:"Failed to update settings",
    });

  }

}

