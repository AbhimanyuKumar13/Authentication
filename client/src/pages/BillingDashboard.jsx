import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import { Context } from "../context/AuthContext.js";
import logo from "../assets/logo.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import i18n from "../i18n.js";
import { localizeApiMessage } from "../utils/localizeApiMessage.js";
import "../styles/BillingDashboard.css";

const API_BASE = "http://localhost:4000/api/v1/billing";

const createEmptyItem = () => ({
  description: "",
  hsnSac: "998314",
  quantity: 1,
  rate: "",
  amount: 0,
});

const defaultCompany = {
  name: "",
  email: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  gstin: "",
  logo: "",
};

const defaultBill = {
  billNumber: "",
  billDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  invoiceType: "GST Bill",
  interstate: false,
  status: "draft",
  notes: "",
  client: {
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    gstin: "",
  },
};

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  const locale = i18n.resolvedLanguage === "hi" ? "hi-IN" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const BillingDashboard = () => {
  const { t } = useTranslation();
  const { user, setUser, setIsAuthenticated } = useContext(Context);
  const navigate = useNavigate();
  const [companyProfile, setCompanyProfile] = useState(defaultCompany);
  const [savedCompanyProfile, setSavedCompanyProfile] = useState(null);
  const [billForm, setBillForm] = useState(defaultBill);
  const [items, setItems] = useState([createEmptyItem()]);
  const [bills, setBills] = useState([]);
  const [binBills, setBinBills] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [billSearch, setBillSearch] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState("");
  const [billDateFrom, setBillDateFrom] = useState("");
  const [billDateTo, setBillDateTo] = useState("");
  const [billAmountMin, setBillAmountMin] = useState("");
  const [billAmountMax, setBillAmountMax] = useState("");

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    const tax = subtotal * 0.18;
    const cgst = billForm.interstate ? 0 : tax / 2;
    const sgst = billForm.interstate ? 0 : tax / 2;
    const igst = billForm.interstate ? tax : 0;
    const total = subtotal + tax;

    return { subtotal, tax, cgst, sgst, igst, total };
  }, [items, billForm.interstate]);

  const billTypes = Array.from(
    new Set(bills.map((bill) => bill.invoiceType).filter(Boolean)),
  );
  const normalizedBillSearch = billSearch.trim().toLocaleLowerCase();
  const filteredBills = bills.filter((bill) => {
    const searchableText = [
      bill.billNumber,
      bill.client?.name,
      bill.client?.email,
      bill.client?.gstin,
      bill.client?.city,
      bill.client?.state,
      bill.invoiceType,
      bill.status,
      t(`dashboard.${bill.status}`, { defaultValue: bill.status }),
      bill.notes,
      ...(bill.items || []).flatMap((item) => [item.description, item.hsnSac]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    const billDate = String(bill.billDate || "").slice(0, 10);
    const total = Number(bill.total || 0);

    return (
      (!normalizedBillSearch ||
        searchableText.includes(normalizedBillSearch)) &&
      (!billStatusFilter || bill.status === billStatusFilter) &&
      (!billTypeFilter || bill.invoiceType === billTypeFilter) &&
      (!billDateFrom || billDate >= billDateFrom) &&
      (!billDateTo || billDate <= billDateTo) &&
      (billAmountMin === "" || total >= Number(billAmountMin)) &&
      (billAmountMax === "" || total <= Number(billAmountMax))
    );
  });

  const clearBillFilters = () => {
    setBillSearch("");
    setBillStatusFilter("");
    setBillTypeFilter("");
    setBillDateFrom("");
    setBillDateTo("");
    setBillAmountMin("");
    setBillAmountMax("");
  };

  const fetchData = async () => {
    try {
      const [companyRes, billsRes, binRes] = await Promise.all([
        axios.get(`${API_BASE}/company-profile`),
        axios.get(`${API_BASE}/bills`),
        axios.get(`${API_BASE}/bills/bin`),
      ]);

      if (companyRes.data?.data) {
        setCompanyProfile(companyRes.data.data);
        setSavedCompanyProfile(companyRes.data.data);
      }

      setBills(billsRes.data?.data || []);
      setBinBills(binRes.data?.data || []);
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("dashboard.loadFailed"),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:4000/api/v1/user/logout");
      toast.success(
        localizeApiMessage("log out successfully", t, t("api.loggedOut")),
      );
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("api.loggedOut"),
        ),
      );
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate("/auth", { replace: true });
    }
  };

  const handleCompanyFieldChange = (event) => {
    const { name, value } = event.target;
    setCompanyProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanyLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyProfile((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleBillFieldChange = (event) => {
    const { name, value } = event.target;
    setBillForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientFieldChange = (event) => {
    const { name, value } = event.target;
    setBillForm((prev) => ({
      ...prev,
      client: { ...prev.client, [name]: value },
    }));
  };

  const updateItem = (index, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const updatedItem = {
          ...item,
          [field]:
            field === "quantity"
              ? Number(value || 0)
              : field === "rate"
                ? value === ""
                  ? ""
                  : Number(value)
                : value,
        };

        updatedItem.amount =
          Number(updatedItem.quantity || 0) * Number(updatedItem.rate || 0);

        return updatedItem;
      }),
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItemRow = (index) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return [createEmptyItem()];
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const resetForm = () => {
    setBillForm({
      ...defaultBill,
      billDate: new Date().toISOString().slice(0, 10),
    });
    setItems([createEmptyItem()]);
    setSelectedBillId(null);
  };

  const handleSaveCompanyProfile = async () => {
    try {
      const payload = {
        ...companyProfile,
      };

      const response = await axios.post(`${API_BASE}/company-profile`, payload);
      setSavedCompanyProfile(response.data?.data || payload);
      toast.success(
        localizeApiMessage(
          response.data?.message,
          t,
          t("dashboard.companySaved"),
        ),
      );
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("dashboard.companySaveFailed"),
        ),
      );
    }
  };

  const handleSaveBill = async (event) => {
    event.preventDefault();

    if (!companyProfile.name) {
      toast.error(t("dashboard.companyRequired"));
      return;
    }

    const payload = {
      ...billForm,
      company: { ...companyProfile },
      client: billForm.client,
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      total: totals.total,
    };

    try {
      if (selectedBillId) {
        await axios.put(`${API_BASE}/bills/${selectedBillId}`, payload);
        toast.success(t("dashboard.billUpdated"));
      } else {
        await axios.post(`${API_BASE}/bills`, payload);
        toast.success(t("dashboard.billGenerated"));
      }

      await fetchData();
      resetForm();
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("dashboard.billSaveFailed"),
        ),
      );
    }
  };

  const handleEditBill = (bill) => {
    setSelectedBillId(bill._id);
    setBillForm({
      billNumber: bill.billNumber,
      billDate: bill.billDate
        ? new Date(bill.billDate).toISOString().slice(0, 10)
        : "",
      dueDate: bill.dueDate
        ? new Date(bill.dueDate).toISOString().slice(0, 10)
        : "",
      invoiceType: bill.invoiceType || "GST Bill",
      interstate: Boolean(bill.interstate),
      status: bill.status || "draft",
      notes: bill.notes || "",
      client: {
        name: bill.client?.name || "",
        email: bill.client?.email || "",
        address: bill.client?.address || "",
        city: bill.client?.city || "",
        state: bill.client?.state || "",
        postalCode: bill.client?.postalCode || "",
        gstin: bill.client?.gstin || "",
      },
    });

    setItems(
      bill.items && bill.items.length
        ? bill.items.map((item) => ({
            description: item.description || "",
            hsnSac: item.hsnSac || "",
            quantity: Number(item.quantity || 1),
            rate: item.rate ?? "",
            amount: Number(item.amount || 0),
          }))
        : [createEmptyItem()],
    );

    setActiveSection("dashboard");
  };

  const handleDeleteBill = async (id) => {
    try {
      await axios.delete(`${API_BASE}/bills/${id}`);
      toast.success(t("dashboard.billMovedToBin"));
      await fetchData();
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("dashboard.billDeleteFailed"),
        ),
      );
    }
  };

  const handleRestoreBill = async (id) => {
    try {
      await axios.patch(`${API_BASE}/bills/${id}/restore`);
      toast.success(t("dashboard.billRestored"));
      await fetchData();
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("dashboard.billRestoreFailed"),
        ),
      );
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/bills/${id}/permanent`);
      toast.success(t("dashboard.billPermanentlyDeleted"));
      await fetchData();
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("dashboard.billPermanentDeleteFailed"),
        ),
      );
    }
  };

  const downloadPDF = async (billData) => {
    const invoice = billData || {
      billNumber: billForm.billNumber,
      billDate: billForm.billDate,
      dueDate: billForm.dueDate,
      invoiceType: billForm.invoiceType,
      interstate: billForm.interstate,
      status: billForm.status,
      notes: billForm.notes,
      client: billForm.client,
      company: companyProfile,
      items,
    };

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const useHindiPdf = i18n.resolvedLanguage === "hi";
    const nativePdfText = doc.text.bind(doc);

    if (useHindiPdf && document.fonts) {
      await document.fonts.load('400 16px "Noto Sans Devanagari"');
      await document.fonts.load('700 16px "Noto Sans Devanagari"');
    }

    if (useHindiPdf) {
      doc.text = (text, x, y, options = {}) => {
        const fontScale = 2;
        const fontSize = doc.getFontSize();
        const fontPixels = fontSize * fontScale;
        const fontStyle = doc.getFont().fontStyle === "bold" ? 700 : 400;
        const textCanvas = document.createElement("canvas");
        const context = textCanvas.getContext("2d");
        context.font = `${fontStyle} ${fontPixels}px "Noto Sans Devanagari", sans-serif`;
        context.fillStyle = doc.getTextColor();

        const maxWidth = options.maxWidth ? options.maxWidth * fontScale : 0;
        const lines = [];
        const sourceLines = Array.isArray(text)
          ? text.map(String)
          : String(text).split("\n");

        sourceLines.forEach((sourceLine) => {
          if (!maxWidth || !sourceLine.trim()) {
            lines.push(sourceLine);
            return;
          }
          let currentLine = "";
          sourceLine.split(/\s+/).forEach((word) => {
            const candidate = currentLine ? `${currentLine} ${word}` : word;
            if (
              currentLine &&
              context.measureText(candidate).width > maxWidth
            ) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = candidate;
            }
          });
          if (currentLine) lines.push(currentLine);
        });

        if (!lines.length) return doc;

        const imageWidth = Math.max(
          1,
          ...lines.map((line) => context.measureText(line).width),
        );
        const lineHeight = fontPixels * 1.3;
        textCanvas.width = Math.ceil(imageWidth + fontScale * 2);
        textCanvas.height = Math.ceil(
          lineHeight * lines.length + fontPixels * 0.25,
        );
        context.font = `${fontStyle} ${fontPixels}px "Noto Sans Devanagari", sans-serif`;
        context.fillStyle = doc.getTextColor();
        context.textBaseline = "alphabetic";
        context.textAlign = options.align || "left";
        lines.forEach((line, index) => {
          const textX =
            options.align === "right"
              ? textCanvas.width - fontScale
              : options.align === "center"
                ? textCanvas.width / 2
                : fontScale;
          context.fillText(line, textX, fontPixels + index * lineHeight);
        });

        const widthInPoints = textCanvas.width / fontScale;
        const heightInPoints = textCanvas.height / fontScale;
        const imageX =
          options.align === "right"
            ? x - widthInPoints
            : options.align === "center"
              ? x - widthInPoints / 2
              : x;
        doc.addImage(
          textCanvas.toDataURL("image/png"),
          "PNG",
          imageX,
          y - fontSize * 0.8,
          widthInPoints,
          heightInPoints,
          undefined,
          "FAST",
        );
        return doc;
      };
    } else {
      doc.text = nativePdfText;
    }
    const margin = 42;
    const company = invoice.company || companyProfile;
    const client = invoice.client || billForm.client;
    const invoiceItems = invoice.items || items;
    const right = pageWidth - margin;
    const contentWidth = pageWidth - margin * 2;
    const safeText = (value) => {
      const text = value == null ? "" : String(value).trim();
      return text === "-" ? "" : text;
    };
    const pdfMoney = (value) =>
      `₹${new Intl.NumberFormat(
        i18n.resolvedLanguage === "hi" ? "hi-IN" : "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      ).format(Number(value) || 0)}`;
    const pdfDate = (value) => {
      if (!value) return t("common.notSpecified");
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? safeText(value)
        : date.toLocaleDateString(
            i18n.resolvedLanguage === "hi" ? "hi-IN" : "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            },
          );
    };
    const subtotal = invoiceItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const cgst = invoice.interstate ? 0 : Math.round((tax / 2) * 100) / 100;
    const sgst = invoice.interstate ? 0 : tax - cgst;
    const igst = invoice.interstate ? tax : 0;
    const total = subtotal + tax;

    const colors = {
      ink: [28, 43, 54],
      muted: [100, 116, 128],
      teal: [17, 61, 76],
      accent: [28, 131, 125],
      line: [222, 230, 234],
      pale: [244, 248, 249],
      white: [255, 255, 255],
    };
    const setText = (color) => doc.setTextColor(...color);
    const drawCard = (x, y, width, height) => {
      doc.setFillColor(...colors.white);
      doc.setDrawColor(...colors.line);
      doc.roundedRect(x, y, width, height, 9, 9, "FD");
    };

    doc.setFillColor(...colors.white);
    doc.rect(0, 0, pageWidth, 154, "F");
    doc.setFillColor(...colors.white);
    doc.rect(0, 0, 7, 154, "F");
    doc.setDrawColor(...colors.line);
    doc.line(margin, 153, right, 153);

    let companyTextX = margin;
    if (company.logo) {
      try {
        doc.addImage(company.logo, margin, 28, 46, 46, undefined, "FAST");
        companyTextX = margin + 60;
      } catch {
        companyTextX = margin;
      }
    }

    setText(colors.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text(safeText(company.name) || t("pdf.companyName"), companyTextX, 42, {
      maxWidth: 310,
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(colors.muted);
    const companyAddress = [
      safeText(company.address),
      [company.city, company.state, company.postalCode]
        .map(safeText)
        .filter(Boolean)
        .join(", "),
    ].filter(Boolean);
    const companyContact = [
      company.email && `Email: ${safeText(company.email)}`,
      company.gstin && `GSTIN: ${safeText(company.gstin)}`,
    ].filter(Boolean);
    [...companyAddress, ...companyContact].forEach((line, index) => {
      doc.text(line, companyTextX, 66 + index * 14, { maxWidth: 315 });
    });

    setText(colors.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(t("pdf.taxInvoice"), right, 39, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(colors.muted);
    doc.text(
      `${t(invoice.interstate ? "pdf.interstate" : "pdf.intrastate")}  |  ${t(`dashboard.${invoice.status || "draft"}`)}`,
      right,
      56,
      { align: "right" },
    );
    doc.text(
      `${t("pdf.invoiceNo")}  ${safeText(invoice.billNumber) || t("dashboard.draft")}`,
      right,
      76,
      {
        align: "right",
      },
    );
    doc.text(`${t("pdf.issueDate")}  ${pdfDate(invoice.billDate)}`, right, 93, {
      align: "right",
    });
    if (invoice.dueDate) {
      doc.text(`${t("pdf.dueDate")}  ${pdfDate(invoice.dueDate)}`, right, 110, {
        align: "right",
      });
    }

    const detailsY = 174;
    const detailsHeight = 116;
    const clientWidth = contentWidth;
    drawCard(margin, detailsY, clientWidth, detailsHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(colors.accent);
    doc.text(t("pdf.billTo"), margin + 16, detailsY + 21);
    setText(colors.ink);
    doc.setFontSize(12);
    doc.text(
      safeText(client.name) || t("pdf.client"),
      margin + 16,
      detailsY + 42,
      {
        maxWidth: clientWidth - 32,
      },
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(colors.muted);
    const clientAddress = [
      safeText(client.address),
      [client.city, client.state, client.postalCode]
        .map(safeText)
        .filter(Boolean)
        .join(", "),
    ].filter(Boolean);
    const clientContact = [
      client.email && `Email: ${safeText(client.email)}`,
      client.gstin && `GSTIN: ${safeText(client.gstin)}`,
    ].filter(Boolean);
    [...clientAddress, ...clientContact].slice(0, 4).forEach((line, index) => {
      doc.text(line, margin + 16, detailsY + 60 + index * 12, {
        maxWidth: clientWidth - 32,
      });
    });

    const tableX = margin;
    const tableY = 304;
    const tableWidth = contentWidth;
    const headerHeight = 28;
    const descriptionWidth = 228;
    const hsnWidth = 76;
    const quantityWidth = 44;
    const rateWidth = 84;
    const xDescription = tableX + 12;
    const xHsn = tableX + descriptionWidth;
    const xQuantity = xHsn + hsnWidth;
    const xRate = xQuantity + quantityWidth;

    doc.setFillColor(...colors.teal);
    doc.roundedRect(tableX, tableY, tableWidth, headerHeight, 6, 6, "F");
    setText(colors.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(t("pdf.description"), xDescription, tableY + 18);
    doc.text(t("pdf.hsnSac"), xHsn + 4, tableY + 18);
    doc.text(t("pdf.quantity"), xQuantity + quantityWidth / 2, tableY + 18, {
      align: "center",
    });
    doc.text(t("pdf.rate"), xRate + rateWidth - 8, tableY + 18, {
      align: "right",
    });
    doc.text(t("pdf.amount"), tableX + tableWidth - 12, tableY + 18, {
      align: "right",
    });

    const rows = invoiceItems.map((item) => {
      const descriptionLines = doc.splitTextToSize(
        safeText(item.description) || t("pdf.item"),
        descriptionWidth - 26,
      );
      return {
        item,
        descriptionLines,
        naturalHeight: Math.max(26, descriptionLines.length * 10 + 14),
      };
    });
    const tableBottomLimit = 610;
    const availableRowsHeight = Math.max(
      48,
      tableBottomLimit - tableY - headerHeight,
    );
    const naturalRowsHeight = rows.reduce(
      (sum, row) => sum + row.naturalHeight,
      0,
    );
    const rowScale =
      naturalRowsHeight > availableRowsHeight
        ? availableRowsHeight / naturalRowsHeight
        : 1;
    let rowY = tableY + headerHeight;

    rows.forEach(({ item, descriptionLines, naturalHeight }, index) => {
      const rowHeight = naturalHeight * rowScale;
      if (index % 2 === 0) {
        doc.setFillColor(...colors.pale);
        doc.rect(tableX, rowY, tableWidth, rowHeight, "F");
      }
      doc.setDrawColor(...colors.line);
      doc.line(tableX, rowY + rowHeight, tableX + tableWidth, rowY + rowHeight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(Math.max(6, Math.min(9, rowHeight * 0.34)));
      setText(colors.ink);
      const lineHeight = Math.max(
        7,
        Math.min(10, (rowHeight - 6) / descriptionLines.length),
      );
      descriptionLines.forEach((line, lineIndex) => {
        doc.text(line, xDescription, rowY + 12 + lineIndex * lineHeight, {
          maxWidth: descriptionWidth - 22,
        });
      });
      doc.text(
        safeText(item.hsnSac) || "-",
        xHsn + 4,
        rowY + rowHeight / 2 + 3,
        {
          maxWidth: hsnWidth - 8,
        },
      );
      doc.text(
        String(Number(item.quantity) || 0),
        xQuantity + quantityWidth / 2,
        rowY + rowHeight / 2 + 3,
        {
          align: "center",
        },
      );
      doc.text(
        pdfMoney(item.rate),
        xRate + rateWidth - 8,
        rowY + rowHeight / 2 + 3,
        {
          align: "right",
        },
      );
      doc.text(
        pdfMoney(item.amount),
        tableX + tableWidth - 12,
        rowY + rowHeight / 2 + 3,
        {
          align: "right",
        },
      );
      rowY += rowHeight;
    });

    const summaryY = Math.max(rowY + 18, 390);
    const summaryWidth = 218;
    const summaryX = right - summaryWidth;
    const summaryHeight = invoice.interstate ? 100 : 118;
    drawCard(summaryX, summaryY, summaryWidth, summaryHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(colors.muted);
    doc.text(t("pdf.taxableAmount"), summaryX + 14, summaryY + 20);
    doc.text(pdfMoney(subtotal), right - 14, summaryY + 20, { align: "right" });

    if (invoice.interstate) {
      doc.text(t("pdf.igst"), summaryX + 14, summaryY + 39);
      doc.text(pdfMoney(igst), right - 14, summaryY + 39, { align: "right" });
    } else {
      doc.text(t("pdf.cgst"), summaryX + 14, summaryY + 39);
      doc.text(pdfMoney(cgst), right - 14, summaryY + 39, { align: "right" });
      doc.text(t("pdf.sgst"), summaryX + 14, summaryY + 57);
      doc.text(pdfMoney(sgst), right - 14, summaryY + 57, { align: "right" });
    }

    const totalY = invoice.interstate ? summaryY + 65 : summaryY + 83;
    doc.setFillColor(...colors.teal);
    doc.roundedRect(summaryX, totalY, summaryWidth, 34, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(colors.white);
    doc.text(t("pdf.totalDue"), summaryX + 14, totalY + 22);
    doc.text(pdfMoney(total), right - 14, totalY + 22, { align: "right" });

    if (invoice.notes) {
      const notesX = margin;
      const notesWidth = summaryX - margin - 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(colors.accent);
      doc.text(t("pdf.notes"), notesX, summaryY + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setText(colors.muted);
      doc.text(
        doc.splitTextToSize(safeText(invoice.notes), notesWidth).slice(0, 5),
        notesX,
        summaryY + 28,
        {
          maxWidth: notesWidth,
        },
      );
    }

    doc.setDrawColor(...colors.line);
    doc.line(margin, pageHeight - 42, right, pageHeight - 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(colors.muted);
    doc.text(t("pdf.thanks"), margin, pageHeight - 26);
    doc.text(
      safeText(company.name) || t("pdf.gstInvoice"),
      right,
      pageHeight - 26,
      {
        align: "right",
      },
    );

    doc.save(`${invoice.billNumber || "invoice"}.pdf`);
  };

  if (loading) {
    return <div className="billing-loading">{t("dashboard.loading")}</div>;
  }

  return (
    <div className="billing-app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="ledger-brand-row">
            <img src={logo} alt="" className="sidebar-logo" />
            <h1>PSS Ledger</h1>
          </div>
          <p>{t("dashboard.brandDescription")}</p>
        </div>
        <div className="sidebar-account">
          <span className="account-avatar">
            {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
          </span>
          <div className="account-copy">
            <strong>{user?.name || t("dashboard.account")}</strong>
            <small>{user?.email}</small>
          </div>
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            {t("dashboard.logout")}
          </button>
        </div>

        <button
          className={
            activeSection === "dashboard" ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveSection("dashboard")}
        >
          {t("dashboard.generateBill")}
        </button>
        <button
          className={
            activeSection === "company" ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveSection("company")}
        >
          {t("dashboard.companySetup")}
        </button>
        <button
          className={
            activeSection === "bills" ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveSection("bills")}
        >
          {t("dashboard.bills")}
        </button>
        <button
          className={
            activeSection === "bin" ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveSection("bin")}
        >
          {t("dashboard.bin")}
        </button>
        <LanguageSwitcher className="dashboard-language-switcher" />
      </aside>

      <main className="content-panel">
        {activeSection === "company" && (
          <>
            <section className="topbar">
              <div>
                <p className="eyebrow">{t("dashboard.businessProfile")}</p>
                <h2>{t("dashboard.companySetup")}</h2>
              </div>
              <button
                className="primary-button"
                onClick={handleSaveCompanyProfile}
              >
                {t("dashboard.saveCompany")}
              </button>
            </section>

            <div className="company-card">
              <div className="company-header-row">
                <div className="logo-upload-box">
                  {companyProfile.logo ? (
                    <img
                      src={companyProfile.logo}
                      alt="Company logo"
                      className="logo-preview"
                    />
                  ) : (
                    <span>{t("dashboard.companyLogo")}</span>
                  )}
                </div>
                <label className="field-group logo-file-field">
                  <span>{t("dashboard.companyLogo")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCompanyLogoUpload}
                    className="file-input"
                  />
                </label>
              </div>

              <div className="grid-two">
                <label className="field-group">
                  <span>{t("dashboard.companyName")}</span>
                  <input
                    name="name"
                    value={companyProfile.name}
                    onChange={handleCompanyFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.gstin")}</span>
                  <input
                    name="gstin"
                    value={companyProfile.gstin}
                    onChange={handleCompanyFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.companyEmail")}</span>
                  <input
                    name="email"
                    type="email"
                    value={companyProfile.email}
                    onChange={handleCompanyFieldChange}
                  />
                </label>
                <label className="field-group span-two">
                  <span>{t("dashboard.businessAddress")}</span>
                  <input
                    name="address"
                    value={companyProfile.address}
                    onChange={handleCompanyFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.city")}</span>
                  <input
                    name="city"
                    value={companyProfile.city}
                    onChange={handleCompanyFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.state")}</span>
                  <input
                    name="state"
                    value={companyProfile.state}
                    onChange={handleCompanyFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.postalCode")}</span>
                  <input
                    name="postalCode"
                    value={companyProfile.postalCode}
                    onChange={handleCompanyFieldChange}
                  />
                </label>
              </div>
            </div>

            {savedCompanyProfile && (
              <section className="company-saved-summary">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">{t("dashboard.savedProfile")}</p>
                    <h3>{savedCompanyProfile.name}</h3>
                  </div>
                  {savedCompanyProfile.logo && (
                    <img
                      src={savedCompanyProfile.logo}
                      alt={`${savedCompanyProfile.name} logo`}
                      className="saved-company-logo"
                    />
                  )}
                </div>
                <div className="saved-company-details">
                  <p>
                    {savedCompanyProfile.gstin ||
                      t("dashboard.gstinNotProvided")}
                  </p>
                  <p>
                    {savedCompanyProfile.email ||
                      t("dashboard.emailNotProvided")}
                  </p>
                  <p>
                    {[
                      savedCompanyProfile.address,
                      savedCompanyProfile.city,
                      savedCompanyProfile.state,
                      savedCompanyProfile.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || t("dashboard.addressNotProvided")}
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        {activeSection === "dashboard" && (
          <form className="bill-form-card" onSubmit={handleSaveBill}>
            <div className="section-heading-row">
              <h3>{t("dashboard.invoiceDetails")}</h3>
              <div className="inline-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  {t("dashboard.reset")}
                </button>
                <button type="submit" className="primary-button">
                  {selectedBillId
                    ? t("dashboard.updateBill")
                    : t("dashboard.saveBill")}
                </button>
              </div>
            </div>

            <div className="grid-four">
              <label className="field-group">
                <span>{t("dashboard.billNumber")}</span>
                <input
                  name="billNumber"
                  value={billForm.billNumber}
                  onChange={handleBillFieldChange}
                />
              </label>
              <label className="field-group">
                <span>{t("dashboard.billDate")}</span>
                <input
                  name="billDate"
                  type="date"
                  value={billForm.billDate}
                  onChange={handleBillFieldChange}
                />
              </label>
              <label className="field-group">
                <span>{t("dashboard.dueDate")}</span>
                <input
                  name="dueDate"
                  type="date"
                  value={billForm.dueDate}
                  onChange={handleBillFieldChange}
                />
              </label>
              <label className="field-group">
                <span>{t("dashboard.status")}</span>
                <select
                  name="status"
                  value={billForm.status}
                  onChange={handleBillFieldChange}
                >
                  <option value="draft">{t("dashboard.draft")}</option>
                  <option value="sent">{t("dashboard.sent")}</option>
                  <option value="paid">{t("dashboard.paid")}</option>
                  <option value="overdue">{t("dashboard.overdue")}</option>
                </select>
              </label>
            </div>

            <label className="interstate-toggle">
              <input
                type="checkbox"
                checked={Boolean(billForm.interstate)}
                onChange={(event) =>
                  setBillForm((prev) => ({
                    ...prev,
                    interstate: event.target.checked,
                  }))
                }
              />
              <span>
                <strong>{t("dashboard.interstate")}</strong>
                <small>{t("dashboard.interstateHelp")}</small>
              </span>
            </label>

            <div className="client-block">
              <h4>{t("dashboard.clientDetails")}</h4>
              <div className="grid-four">
                <label className="field-group">
                  <span>{t("dashboard.clientName")}</span>
                  <input
                    name="name"
                    value={billForm.client.name}
                    onChange={handleClientFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.clientEmail")}</span>
                  <input
                    name="email"
                    type="email"
                    value={billForm.client.email}
                    onChange={handleClientFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.clientGstin")}</span>
                  <input
                    name="gstin"
                    value={billForm.client.gstin}
                    onChange={handleClientFieldChange}
                  />
                </label>
                <label className="field-group span-four">
                  <span>{t("dashboard.clientAddress")}</span>
                  <input
                    name="address"
                    value={billForm.client.address}
                    onChange={handleClientFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.city")}</span>
                  <input
                    name="city"
                    value={billForm.client.city}
                    onChange={handleClientFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.state")}</span>
                  <input
                    name="state"
                    value={billForm.client.state}
                    onChange={handleClientFieldChange}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.postalCode")}</span>
                  <input
                    name="postalCode"
                    value={billForm.client.postalCode}
                    onChange={handleClientFieldChange}
                  />
                </label>
              </div>
            </div>

            <div className="items-block">
              <div className="section-heading-row">
                <h4>{t("dashboard.items")}</h4>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={addItemRow}
                >
                  {t("dashboard.addItem")}
                </button>
              </div>

              <div className="items-table">
                <div className="items-header row-grid">
                  <span>{t("dashboard.description")}</span>
                  <span>{t("dashboard.hsnSac")}</span>
                  <span>{t("dashboard.quantity")}</span>
                  <span>{t("dashboard.rate")}</span>
                  <span>{t("dashboard.amount")}</span>
                  <span></span>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="item-row row-grid">
                    <input
                      aria-label={t("dashboard.itemDescription", {
                        number: index + 1,
                      })}
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                    />
                    <input
                      aria-label={t("dashboard.itemHsnSac", {
                        number: index + 1,
                      })}
                      value={item.hsnSac}
                      onChange={(e) =>
                        updateItem(index, "hsnSac", e.target.value)
                      }
                    />
                    <input
                      aria-label={t("dashboard.itemQuantity", {
                        number: index + 1,
                      })}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                    />
                    <input
                      aria-label={t("dashboard.itemRate", {
                        number: index + 1,
                      })}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(index, "rate", e.target.value)
                      }
                    />
                    <span className="amount-tag">
                      {formatCurrency(item.amount)}
                    </span>
                    <button
                      type="button"
                      className="delete-item-button"
                      onClick={() => removeItemRow(index)}
                    >
                      {t("dashboard.remove")}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="summary-box">
              <div className="summary-row">
                <span>{t("dashboard.subtotal")}</span>
                <strong>{formatCurrency(totals.subtotal)}</strong>
              </div>
              {billForm.interstate ? (
                <div className="summary-row">
                  <span>{t("dashboard.igst")}</span>
                  <strong>{formatCurrency(totals.igst)}</strong>
                </div>
              ) : (
                <>
                  <div className="summary-row">
                    <span>{t("dashboard.cgst")}</span>
                    <strong>{formatCurrency(totals.cgst)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("dashboard.sgst")}</span>
                    <strong>{formatCurrency(totals.sgst)}</strong>
                  </div>
                </>
              )}
              <div className="summary-row">
                <span>{t("dashboard.tax")}</span>
                <strong>{formatCurrency(totals.tax)}</strong>
              </div>
              <div className="summary-row total">
                <span>{t("dashboard.total")}</span>
                <strong>{formatCurrency(totals.total)}</strong>
              </div>
            </div>

            <label className="field-group notes-field" htmlFor="invoice-notes">
              <span>{t("dashboard.invoiceNotes")}</span>
              <textarea
                id="invoice-notes"
                name="notes"
                value={billForm.notes}
                onChange={handleBillFieldChange}
                className="notes-area"
              />
            </label>
          </form>
        )}

        {activeSection === "bills" && (
          <div className="records-card">
            <div className="section-heading-row">
              <h3>{t("dashboard.savedBills")}</h3>
              {bills.length > 0 && (
                <span className="bill-filter-count">
                  {t("dashboard.showingBills", {
                    shown: filteredBills.length,
                    total: bills.length,
                  })}
                </span>
              )}
            </div>

            {bills.length > 0 && (
              <div
                className="bill-filters"
                aria-label={t("dashboard.filtersAria")}
              >
                <label className="field-group bill-search-field">
                  <span>{t("dashboard.searchBills")}</span>
                  <input
                    type="search"
                    value={billSearch}
                    onChange={(event) => setBillSearch(event.target.value)}
                    placeholder={t("dashboard.searchPlaceholder")}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.status")}</span>
                  <select
                    value={billStatusFilter}
                    onChange={(event) =>
                      setBillStatusFilter(event.target.value)
                    }
                  >
                    <option value="">{t("dashboard.allStatuses")}</option>
                    <option value="draft">{t("dashboard.draft")}</option>
                    <option value="sent">{t("dashboard.sent")}</option>
                    <option value="paid">{t("dashboard.paid")}</option>
                    <option value="overdue">{t("dashboard.overdue")}</option>
                  </select>
                </label>
                <label className="field-group">
                  <span>{t("dashboard.invoiceType")}</span>
                  <select
                    value={billTypeFilter}
                    onChange={(event) => setBillTypeFilter(event.target.value)}
                  >
                    <option value="">{t("dashboard.allTypes")}</option>
                    {billTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === "GST Bill"
                          ? t("dashboard.gstBillType")
                          : type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-group">
                  <span>{t("dashboard.dateFrom")}</span>
                  <input
                    type="date"
                    value={billDateFrom}
                    onChange={(event) => setBillDateFrom(event.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.dateTo")}</span>
                  <input
                    type="date"
                    value={billDateTo}
                    onChange={(event) => setBillDateTo(event.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.minimumTotal")}</span>
                  <input
                    type="number"
                    min="0"
                    value={billAmountMin}
                    onChange={(event) => setBillAmountMin(event.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span>{t("dashboard.maximumTotal")}</span>
                  <input
                    type="number"
                    min="0"
                    value={billAmountMax}
                    onChange={(event) => setBillAmountMax(event.target.value)}
                  />
                </label>
                <div className="bill-filter-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={clearBillFilters}
                  >
                    {t("common.clearFilters")}
                  </button>
                </div>
              </div>
            )}

            <div className="record-list">
              {bills.length === 0 ? (
                <p className="empty-text">{t("dashboard.noBillsYet")}</p>
              ) : filteredBills.length === 0 ? (
                <div className="empty-text bill-no-results">
                  <p>{t("dashboard.noBillsMatch")}</p>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={clearBillFilters}
                  >
                    {t("common.clearFilters")}
                  </button>
                </div>
              ) : (
                filteredBills.map((bill) => (
                  <div key={bill._id} className="record-item">
                    <div>
                      <strong>{bill.billNumber}</strong>
                      <p>{bill.client?.name}</p>
                      <small>
                        {new Date(bill.billDate).toLocaleDateString(
                          i18n.resolvedLanguage === "hi" ? "hi-IN" : "en-IN",
                        )}
                      </small>
                    </div>
                    <div className="record-meta">
                      <span>
                        {t(`dashboard.${bill.status}`, {
                          defaultValue: bill.status,
                        })}
                      </span>
                      <strong>{formatCurrency(bill.total)}</strong>
                    </div>
                    <div className="record-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleEditBill(bill)}
                      >
                        {t("dashboard.edit")}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => downloadPDF(bill)}
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDeleteBill(bill._id)}
                      >
                        {t("dashboard.delete")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === "bin" && (
          <div className="records-card">
            <div className="section-heading-row">
              <h3>{t("dashboard.deletedBills")}</h3>
            </div>

            <div className="record-list">
              {binBills.length === 0 ? (
                <p className="empty-text">{t("dashboard.binEmpty")}</p>
              ) : (
                binBills.map((bill) => (
                  <div key={bill._id} className="record-item">
                    <div>
                      <strong>{bill.billNumber}</strong>
                      <p>{bill.client?.name}</p>
                    </div>
                    <div className="record-meta">
                      <strong>{formatCurrency(bill.total)}</strong>
                    </div>
                    <div className="record-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleRestoreBill(bill._id)}
                      >
                        {t("dashboard.restore")}
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handlePermanentDelete(bill._id)}
                      >
                        {t("dashboard.deletePermanently")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BillingDashboard;
