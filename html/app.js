import { TRANSLATIONS } from "./translations.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const $post = async (url, data) => {
    if (!url.startsWith("/")) url = `/${url}`;

    const result = await fetch(`https://qb-fuel${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data ?? {}),
    });

    try {
        return await result.json();
    } catch (e) {
        return {};
    }
};

class ProgressBar {
    constructor(progress) {
        this.progress = progress;
        this.progressValue = Number(this.progress.dataset.value);
        this.progressMax = Number(this.progress.dataset.max);
        this.progressMin = Number(this.progress.dataset.min);
        this.progressFill = this.progress.querySelector(".gauge-fill");
        this.progressText = $("#fuel-percent");
        this.circumference = 2 * Math.PI * 58;

        this.update();
    }

    update() {
        this.progressValue = Number(this.progress.dataset.value);
        this.progressMax = Number(this.progress.dataset.max);
        this.progressMin = Number(this.progress.dataset.min);

        if (this.progressValue > this.progressMax) {
            this.progressValue = this.progressMax;
        }

        if (this.progressValue < this.progressMin) {
            this.progressValue = this.progressMin;
        }

        const percent = this.progressMax === 0 ? 0 : this.progressValue / this.progressMax;
        const dashOffset = this.circumference - percent * this.circumference;

        this.progress.setAttribute("aria-valuenow", Math.round(this.progressValue));
        this.progress.dataset.value = this.progressValue;
        this.progressFill.style.strokeDasharray = this.circumference;
        this.progressFill.style.strokeDashoffset = dashOffset;
        this.progressText.innerText = `${Math.round(this.progressValue)}%`;
    }

    setValue(value) {
        this.progress.dataset.value = value;
        this.update();
    }
}

let LITER_PRICE = 5;
let CURRENT_FUEL = 0;
let SELECTED_PAYMENT = "cash";
let SELECTED_FUEL_TYPE = "diesel";
const MAX_LITER = 100;

$(".progress").dataset.max = MAX_LITER;

const $liter = $("#liter");
const $price = $("#price");
const $form = $("form");
const $purchaseButton = $(".purchase-button");
const pb = new ProgressBar($(".progress"));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getMaxLiter = () => {
    const maxLiter = Number($liter.max);
    return Number.isFinite(maxLiter) ? maxLiter : MAX_LITER;
};

const setClock = () => {
    const now = new Date();
    $("#fuel-date").innerText = now.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).replace(",", ".");
    $("#fuel-time").innerText = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const setRateLabels = () => {
    $$(".fuel-card").forEach((card) => {
        const multiplier = Number(card.dataset.priceMultiplier) || 1;
        const rate = card.querySelector("[data-rate]");
        rate.innerText = Math.floor(LITER_PRICE * multiplier);
    });
};

const setFuelTypeMultipliers = (fuelTypes) => {
    if (!fuelTypes || typeof fuelTypes !== "object") return;

    $$(".fuel-card").forEach((card) => {
        const type = card.dataset.fuelType;
        if (fuelTypes[type]) {
            card.dataset.priceMultiplier = Number(fuelTypes[type]) || 1;
        }
    });
};

const setCardFill = (card, percent) => {
    card.style.setProperty("--fill", `${clamp(percent, 0, 100)}%`);
};

const resetCardFills = () => {
    $$(".fuel-card").forEach((card) => setCardFill(card, 0));
};

const getSelectedCard = () => $(`.fuel-card[data-fuel-type="${SELECTED_FUEL_TYPE}"]`) || $(".fuel-card.active");

const selectFuelCard = (card) => {
    $$(".fuel-card").forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    SELECTED_FUEL_TYPE = card.dataset.fuelType || "diesel";
    updateActiveSlider(parseFloat($liter.value) || 0);
    updateTotals();
};

const updateActiveSlider = (liter) => {
    const maxLiter = getMaxLiter();
    const amount = clamp(Number(liter) || 0, 0, maxLiter);
    const fill = maxLiter <= 0 ? 0 : (amount / maxLiter) * 100;
    const activeCard = getSelectedCard();
    $$(".fuel-card").forEach((card) => setCardFill(card, card === activeCard ? fill : 0));
};

const updateTotals = () => {
    const liter = clamp(parseFloat($liter.value) || 0, 0, getMaxLiter());
    const price = Math.floor(liter * getSelectedUnitPrice());

    $liter.value = liter;
    $price.value = price;
    $("#total-price").innerText = price.toLocaleString("en-US");
    $purchaseButton.disabled = liter <= 0 || price <= 0;
};

const updateLimits = () => {
    const maxLiter = clamp(MAX_LITER - CURRENT_FUEL, 0, MAX_LITER);

    $liter.max = maxLiter;
    $price.max = Math.floor(maxLiter * getSelectedUnitPrice());
    $price.step = Math.max(1, Math.floor(getSelectedUnitPrice()));
    setRateLabels();
    updateTotals();
};

const setVehicleInfo = (data) => {
    $("#vehicle-model").innerText = (data.model || "BALLER4").toUpperCase();
    $("#vehicle-plate").innerText = (data.plate || "45WDM340").toUpperCase();
    $("#vehicle-speed").innerText = Math.max(0, Math.floor(data.speed || 0));
    $("#engine-temp").innerText = Math.max(0, Math.floor(data.engineTemperature || 96));

    const imageName = String(data.imageModel || data.model || "baller4").toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const image = $("#vehicle-image");
    image.classList.remove("is-loaded");
    image.onerror = () => {
        image.onerror = null;
        image.src = "assets/vehicles/adder.png";
    };
    image.onload = () => image.classList.add("is-loaded");
    image.src = `assets/vehicles/${imageName || "baller4"}.png`;
};

const getSelectedUnitPrice = () => {
    const selectedCard = getSelectedCard();
    const multiplier = Number(selectedCard?.dataset.priceMultiplier) || 1;
    return LITER_PRICE * multiplier;
};

const setupTranslations = (language) => {
    document.documentElement.lang = language;
    const translations = TRANSLATIONS[language] ?? TRANSLATIONS.en;
    const fuelTitle = translations.fuel_system ?? "Fuel System";
    $(".brand-lockup h1").innerText = fuelTitle;
};

const resetFuelForm = () => {
    const defaultCard = $(".fuel-card");
    if (defaultCard) {
        $$(".fuel-card").forEach((card) => card.classList.remove("active"));
        defaultCard.classList.add("active");
        SELECTED_FUEL_TYPE = defaultCard.dataset.fuelType || "diesel";
    }

    SELECTED_PAYMENT = "cash";
    $$(".method").forEach((button) => button.classList.toggle("active", button.dataset.method === SELECTED_PAYMENT));
    resetCardFills();
    setLiters(0);
};

const setLoading = (isLoading) => {
    $purchaseButton.classList.toggle("loading", isLoading);
    $purchaseButton.disabled = isLoading || (parseFloat($liter.value) || 0) <= 0 || (parseFloat($price.value) || 0) <= 0;
};

const setLiters = (liter) => {
    const maxLiter = getMaxLiter();
    const value = clamp(Math.floor(liter), 0, maxLiter);
    $liter.value = value;
    $price.value = Math.floor(value * getSelectedUnitPrice());
    pb.setValue(CURRENT_FUEL + value);
    updateActiveSlider(value);
    updateTotals();
};

$liter.addEventListener("input", () => {
    if ($liter.value === "") return setLiters(0);
    setLiters(parseFloat($liter.value));
});

$price.addEventListener("input", () => {
    if ($price.value === "") return setLiters(0);
    const price = Math.max(0, parseFloat($price.value) || 0);
    setLiters(Math.floor(price / getSelectedUnitPrice()));
});

$$(".fuel-card").forEach((card) => {
    card.addEventListener("click", (event) => {
        if (event.target.closest(".fuel-slider")) return;
        selectFuelCard(card);
    });
});

const setLitersFromSliderPointer = (card, event) => {
    const slider = card.querySelector(".fuel-slider");
    const bounds = slider.getBoundingClientRect();
    const percent = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const liter = Math.round(percent * getMaxLiter());

    selectFuelCard(card);
    setLiters(liter);
};

$$(".fuel-slider").forEach((slider) => {
    slider.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const card = slider.closest(".fuel-card");
        if (!card) return;

        slider.setPointerCapture(event.pointerId);
        setLitersFromSliderPointer(card, event);

        const onMove = (moveEvent) => setLitersFromSliderPointer(card, moveEvent);
        const onUp = (upEvent) => {
            slider.releasePointerCapture(upEvent.pointerId);
            slider.removeEventListener("pointermove", onMove);
            slider.removeEventListener("pointerup", onUp);
            slider.removeEventListener("pointercancel", onUp);
        };

        slider.addEventListener("pointermove", onMove);
        slider.addEventListener("pointerup", onUp);
        slider.addEventListener("pointercancel", onUp);
    });
});

$$(".method").forEach((button) => {
    button.addEventListener("click", () => {
        $$(".method").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        SELECTED_PAYMENT = button.dataset.method || "cash";
    });
});

$form.addEventListener("submit", (e) => {
    e.preventDefault();

    const liter = parseFloat($liter.value);
    const price = parseFloat($price.value);

    if (liter <= 0 || price <= 0) {
        return;
    }

    setLoading(true);
    $post("/refill", { liter, paymentMethod: SELECTED_PAYMENT, fuelType: SELECTED_FUEL_TYPE });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        $post("/close");
    }
});

window.addEventListener("message", ({ data }) => {
    if (data.action === "show") {
        LITER_PRICE = Number(data.price) || LITER_PRICE;
        CURRENT_FUEL = clamp(Number(data.currentFuel) || 0, 0, MAX_LITER);
        setFuelTypeMultipliers(data.fuelTypes);
        setClock();
        setVehicleInfo(data.vehicle || {});
        pb.setValue(CURRENT_FUEL);
        resetFuelForm();
        updateLimits();
        setLiters(0);
        setLoading(false);
        $("body").style.display = "block";
    }

    if (data.action === "hide") {
        $("body").style.display = "none";
        setLoading(false);
    }

    if (data.action === "setLanguage") {
        setupTranslations(data.language);
    }
});

setClock();
resetCardFills();
updateTotals();
