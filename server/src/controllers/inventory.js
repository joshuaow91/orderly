import prisma from "../config/prismaClient.js";
import csvtojson from "csvtojson";
import uploadCSV from "../middleware/multerMiddleware.js";



export const getInventoryList = async (req, res) => {
  console.log("req.user.id in inventory controller", req.user.id);

  const queryOptions = {
    where: {
      userId: req.user.id,
    },
    include: {
      orders: true,
    },
  };

  try {
    const inventoryList = await prisma.Product.findMany(queryOptions);
    return res.json(inventoryList);
  } catch (error) {
    console.log("Error Found: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// export const getInventoryItem = async (req, res) => {
//   const { id } = req.params;
//   let inventoryItem;
//   try {
//     const getInventoryItem = await prisma.Product.findUnique({
//       where: {
//         id: Number(id),
//       },
//       include: {
//         orders: true,
//       },
//     });
//     inventoryItem = getInventoryItem;
//   } catch (err) {
//     console.log("Error Found: ", err);
//     return res.json(err);
//   }
//   if (inventoryItem) {
//     return res.json(inventoryItem);
//   } else {
//     return res.json({
//       message: `No products in inventory with the ID ${id}`,
//     });
//   }
// }

export const createInventoryItem = async (req, res) => {
  console.log("createInventoryItem controller user.id: ", req.user.id);
  const {
    sku,
    brand,
    productName,
    description,
    inStock,
    reorderAt,
    shipper,
    orderQty,
    unitPrice,
  } = req.body;
  let emptyField;
  let inventoryItem;
  if (sku.length < 1) {
    emptyField = "SKU";
  } else if (brand.length < 1) {
    emptyField = "brand";
  } else if (productName.length < 1) {
    emptyField = "name";
  }
  if (emptyField) {
    return res
      .status(400)
      .json({ error: `The ${emptyField} field cannot be left blank` });
  }
  try {
    const createInventoryItem = await prisma.Product.create({
      data: {
        userId: req.user.id,
        sku: sku,
        brand: brand,
        productName: productName,
        description: description,
        inStock: inStock,
        shipper: shipper,
        reorderAt: reorderAt,
        orderQty: orderQty,
        unitPrice: unitPrice,
      },
    });
    inventoryItem = createInventoryItem;
  } catch (err) {
    if (err.code === "P2002") {
      if (err.meta.target[0] === "sku") {
        return res.status(400).json({
          error:
            "There is a unique constraint violation, a new product cannot be created with this sku",
        });
      }
    } else if (err.code === "P2009") {
      return res.status(400).json({
        error:
          "Unable to match input value to any allowed input type for the field",
      });
    }
    console.log("Error Found: ", err);
    return res.status(400).json(err);
  }
  return res.json(inventoryItem);
};

export const createManyInventoryItems = async (req, res) => {
  console.log("Product List", req.body.products);
  let inventoryItem;
  try {
    const createInventoryItem = await prisma.Product.createMany({
      data: req.body.products,
    });
    inventoryItem = createInventoryItem;
  } catch (err) {
    if (err.code === "P2002") {
      if (err.meta.target[0] === "sku") {
        return res.status(400).json({
          error:
            "There is a unique constraint violation, a new product cannot be created with this sku",
        });
      }
    } else if (err.code === "P2009") {
      return res.status(400).json({
        error:
          "Unable to match input value to any allowed input type for the field",
      });
    }
    console.log("Error Found: ", err);
    return res.status(400).json(err);
  }
  return res.json(inventoryItem.count);
};

// for the server to use when user is created
export const createManyInventoryItemsInternally = async (products, user) => {
  if (!user) {
    console.log(
      "user is not defined in createManyInv Internally - inventory.js"
    );
  }

  if (!Array.isArray(products)) {
    throw new Error(
      `Expected an array, received ${typeof products}: ${JSON.stringify(
        products
      )}`
    );
  }

  const productsWithUserId = products.map((product) => {
    const { sku, brand, productName } = product;
    let emptyField;

    if (sku.length < 1) {
      emptyField = "SKU";
    } else if (brand.length < 1) {
      emptyField = "brand";
    } else if (productName.length < 1) {
      emptyField = "name";
    }

    if (emptyField) {
      throw new Error(`The ${emptyField} field cannot be left blank`);
    }
    console.log("user.id in create many internally", user.id);

    return {
      ...product,
      userId: user.id,
    };
  });

  let inventoryItem;
  try {
    const createInventoryItem = await prisma.Product.createMany({
      data: productsWithUserId,
    });
    inventoryItem = createInventoryItem;
  } catch (err) {
    console.log("Error Found: ", err);

    if (err.code === "P2002") {
      throw new Error(
        "There is a unique constraint violation, a new product cannot be created with this sku"
      );
    } else if (err.code === "P2009") {
      throw new Error(
        "Unable to match input value to any allowed input type for the field"
      );
    }

    throw err;
  }

  return inventoryItem.count;
};

export const updateInventoryItem = async (req, res) => {
  const { id } = req.params;
  const updatedItem = req.body;
  let product;
  try {
    updatedProduct = await prisma.Product.update({
      where: {
        id: Number(id),
      },
      data: {
        ...updatedItem,
      },
    });
    product = updatedProduct;
  } catch (err) {
    if (err.code === "P2025") {
      return res.json({ message: "Product not found" });
    } else {
      console.log("Error Found: ", err);
      return res.json(err);
    }
  }
  return res.json(product);
};

export const deleteInventoryItems = async (req, res) => {
  const { ids } = req.body;

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  const skus = products.map((product) => product.sku);
  try {
    const ordersResult = await prisma.order.deleteMany({
      where: {
        SKU: {
          in: skus,
        },
      },
    });

    const productResult = await prisma.product.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    console.log(
      `Deleted ${productResult.count} products and ${ordersResult.count} orders`
    );
    return res.json({ message: `Deleted ${productResult.count} products` });
  } catch (err) {
    console.log("Error deleting products:", err);
    return res.status(500).json({ message: "Error deleting products" });
  }
};

export const convertCsvFileToJson = async (req, res) => {
  await uploadCSV(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: "Upload failed" });
    }
    csvtojson()
      .fromFile(req.file.path)
      .then((json) => {
        res.status(200).json(json);
      });
  });
};

export const getInventoryStats = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const totalInventoryItems = await prisma.product.count({
      where: {
        userId: userId
      }
    });

    const userProducts = await prisma.product.findMany({
      where: {
        userId: userId
      },
      select: {
        sku: true
      }
    });
    const userSKUs = userProducts.map(product => product.sku);

    const totalActiveOrders = await prisma.order.count({
      where: {
        SKU: {
          in: userSKUs
        },
        orderStatus: 'active'
      }
    });

    const orders = await prisma.order.findMany({
      where: {
        SKU: {
          in: userSKUs
        }
      }
    });
    const totalSales = orders.reduce((acc, order) => acc + order.totalCost, 0);

    res.json({
      totalInventoryItems,
      totalActiveOrders,
      totalSales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("Error in getInventoryStats:", error);
  }
}

