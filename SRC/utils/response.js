

exports.response = (res, status, data) => {

    res.status(status).json({
      status: "success",
      result: data.length,
      data: {
         data,
      },
    });
}

