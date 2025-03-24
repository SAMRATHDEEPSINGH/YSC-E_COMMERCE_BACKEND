import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

export const addOrUpdateCart = async (req, res) => {
    const { productId, quantity } = req.body; // quantity can be positive or negative for increment/decrement
    const userId = req.user.id; // User ID from authMiddleware
  
    try {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
  
      let cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        // If cart doesn't exist, create a new cart
        cart = new Cart({ user: userId, items: [], totalPrice: 0 });
      }
  
      const existingItem = cart.items.find((item) => item.product.toString() === productId);
  
      if (existingItem) {
        // Update the quantity
        existingItem.quantity += quantity;
  
        // Remove the product if quantity becomes zero or less
        if (existingItem.quantity <= 0) {
          cart.items = cart.items.filter((item) => item.product.toString() !== productId);
        }
      } else {
        // Add the product if it doesn't exist in the cart
        if (quantity > 0) {
          cart.items.push({ product: productId, quantity });
        } else {
          return res.status(400).json({ message: "Quantity should be greater than 0 for a new product" });
        }
      }
  
      // Recalculate the total price
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.quantity * product.price,
        0
      );
  
      await cart.save();
  
      res.status(200).json({ message: "Cart updated successfully", cart });
    } catch (error) {
      res.status(500).json({ message: "Error updating cart", error });
    }
  };

  export const updateCartQuantity = async (req, res) => {
    const { productId, quantity } = req.body; // New quantity value (can be any positive integer)
    const userId = req.user.id;
  
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) return res.status(404).json({ message: "Cart not found" });
  
      const existingItem = cart.items.find((item) => item.product.toString() === productId);
      if (!existingItem) return res.status(404).json({ message: "Product not found in cart" });
  
      // Update quantity
      existingItem.quantity = quantity;
  
      // Remove the product if quantity is zero or less
      if (quantity <= 0) {
        cart.items = cart.items.filter((item) => item.product.toString() !== productId);
      }
  
      // Recalculate total price
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.quantity * item.product.price,
        0
      );
  
      await cart.save();
  
      res.status(200).json({ message: "Quantity updated successfully", cart });
    } catch (error) {
      res.status(500).json({ message: "Error updating quantity", error });
    }
  };

  export const removeFromCart = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
  
    try {
      const cart = await Cart.findOne({ user: userId });
  
      if (!cart) return res.status(404).json({ message: "Cart not found" });
  
      cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.quantity * item.product.price,
        0
      );
  
      await cart.save();
  
      res.status(200).json({ message: "Product removed from cart", cart });
    } catch (error) {
      res.status(500).json({ message: "Error removing product from cart", error });
    }
  };

  export const getCart = async (req, res) => {
    const userId = req.user.id;
  
    try {
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
  
      if (!cart) return res.status(404).json({ message: "Cart not found" });
  
      res.status(200).json({ cart });
    } catch (error) {
      res.status(500).json({ message: "Error fetching cart", error });
    }
  };

  