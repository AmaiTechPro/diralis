import { Request, Response } from "express";

import prisma from "../lib/prisma";


export async function getUserProfile(
  req: Request,
  res: Response
) {

  try {

    const userId =
      req.user?.userId;


    if (!userId) {

      return res.status(401).json({
        message:
          "Authentication required",
      });

    }


    const user =
      await prisma.user.findUnique({

        where: {
          id: userId,
        },

        select: {

          id: true,

          fullName: true,

          username: true,

          email: true,

          picture: true,

          provider: true,

          createdAt: true,


          _count: {

            select: {

              datasets: true,

            },

          },

        },

      });



    if (!user) {

      return res.status(404).json({

        message:
          "User not found",

      });

    }



    return res.json({

      user: {

        id: user.id,

        fullName: user.fullName,

        username: user.username,

        email: user.email,

        picture: user.picture,

        provider: user.provider,

        createdAt: user.createdAt,

      },


      stats: {

        datasets:
          user._count.datasets,

        reports: 0,

        analyses: 0,

      },

    });


  } catch(error) {


    console.error(
      "User profile error:",
      error
    );


    return res.status(500).json({

      message:
        "Failed to load user profile",

    });

  }

}

