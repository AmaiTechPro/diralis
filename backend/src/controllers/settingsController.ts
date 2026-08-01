import { Request, Response } from "express";
import bcrypt from "bcrypt";
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
          emailNotifications:true,
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
      emailNotifications,
    } = req.body;



    const updated =
      await prisma.user.update({

        where:{
          id:userId,
        },

        data:{
          theme,
          emailNotifications,
        },

        select:{
          theme:true,
          emailNotifications:true,
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







export async function updateProfile(
  req: Request,
  res: Response
){

  try {

    const userId =
      (req as any).user.userId;


    const {
      fullName,
      email,
    } = req.body;



    const updated =
      await prisma.user.update({

        where:{
          id:userId,
        },

        data:{
          fullName,
          email,
        },

        select:{
          fullName:true,
          email:true,
          username:true,
        },

      });



    res.json(updated);



  } catch(error){

    console.error(error);


    res.status(500).json({
      message:"Failed to update profile",
    });

  }

}







export async function changePassword(
  req: Request,
  res: Response
){

  try {

    const userId =
      (req as any).user.userId;



    const {
      currentPassword,
      newPassword,
    } = req.body;



    const user =
      await prisma.user.findUnique({

        where:{
          id:userId,
        },

      });



    if(!user){

      return res.status(404).json({
        message:"User not found",
      });

    }


    if(!user.password){

      return res.status(400).json({
        message:"Password change unavailable for this account",
      });

    }



    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );



    if(!passwordMatch){

      return res.status(400).json({
        message:"Current password incorrect",
      });

    }



    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );



    await prisma.user.update({

      where:{
        id:userId,
      },

      data:{
        password:hashedPassword,
      },

    });



    res.json({

      message:"Password updated successfully",

    });



  } catch(error){

    console.error(error);


    res.status(500).json({
      message:"Failed to change password",
    });

  }

}

