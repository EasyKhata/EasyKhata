let loadPromise = null;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
