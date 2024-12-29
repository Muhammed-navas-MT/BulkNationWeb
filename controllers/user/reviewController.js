const Review = require("../../models/reviewScheama");

const addReviews = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.redirect("/signup");
        }

        const { productId, name, description } = req.body;
        console.log("product id", productId, "name", name, "discription", description);

        if (!productId || !name || !description) {
            return res.status(400).json({ success: false, message: "Missing required data" });
        }

        const findProductReview = await Review.findOne({ productId: productId });

        if (!findProductReview) {
            const newReview = new Review({
                productId: productId,
                reviews: [
                    {
                        name: name,
                        discription: description,
                    },
                ],
            });
            await newReview.save();
        } else {
            findProductReview.reviews.push({
                name: name,
                discription: description,
            });
            await findProductReview.save();
        }

        return res.status(200).json({ success: true, message: "Review added successfully" });
    } catch (error) {
        console.error("Review addition error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    addReviews,
};