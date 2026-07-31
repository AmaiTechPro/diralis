import { Request, Response } from "express";

import { generateDatasetProfile } from "../services/analyticsService";

export async function getDatasetProfile(
  req: Request,
  res: Response
) {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Dataset ID is required.",
      });
    }

    {/*const result =
      await generateDatasetProfile(id);

    return res.status(200).json({
      success: true,
      data: result,
    }); */}


    {/* For testing purposes, we will return a mock response. */}

    const result =
  await generateDatasetProfile(id);

console.log(
  "GENERATED PROFILE:",
  JSON.stringify(result, null, 2)
);

return res.status(200).json({
  success: true,
  data: result,
});

 {/* End of mock response. */}

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate analytics profile.",
    });
  }
}
