# Latent-Color-Diffusion-Interface
An interface to add color hints on images for Latent Color Diffusion inference.

For inference with color hints, it is required that the color you add is very desaturated by 75%, because it is directly given to the model as input image.
Moreover, for giving color hint, it is highly recommended to use the YUV color space. Convert your image to YUV space (same as training), and add desaturated colors to UV indices. You convert it back to RGB space and save.

A comparison on usual color spaces shows that the luminance value Y of YUV, YCrCb spaces are the same, and very close to the mean for each pixel : (R+G+B)/3. The luminance value L of HLS and of LAB are very different (from each other and from Y), and the formula for the Hue and Saturation are different enough to give unwanted results. They are also not bijective so you will lose information.
