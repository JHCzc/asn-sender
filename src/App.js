/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  Box,
  CssBaseline,
  Drawer,
  Typography,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  TableCell,
  TableRow,
  TableBody,
  TableHead,
  Table,
  Paper,
  Container,
  TableContainer,
} from "@mui/material";
import { apiRequest } from "./utils/api";
import * as XLSX from "xlsx"; // Import xlsx library
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import "handsontable/languages/en-US";

const logo = require("./assets/images/Logo.png");

const drawerWidth = 400;

function App() {
  const [customer, setCustomer] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [product, setProduct] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [batchId, setBatchId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [expireyDate, setExpireyDate] = useState("");
  const [palletLetter, setPalletLetter] = useState("");
  const [palletStartNr, setPalletStartNr] = useState("");
  const [totalPallets, setTotalPallets] = useState("");
  const [asnData, setAsnData] = useState([]);
  const ssccRefs = useRef([]);
  const [sheetData, setSheetData] = useState([]);
  const [openPreview, setOpenPreview] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: "",
    subject: "",
    text: ""
  })

  // add customer model codes here
  const [customerDetails, setCustomerDetails] = useState({
    customer_name: "",
    contract_number: "",
    supplier_number: "",
    email: "",
    phone_number: "",
  });
  const [customerPopup, setCustomerPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails({
      ...customerDetails,
      [name]: value,
    });
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData({ ...emailData, [name]: value });
  };

  const handleClickOpen = () => {
    setCustomerPopup(true);
  };

  const handleClose = () => {
    setCustomerPopup(false);
  };

  const handelPrieviewOpen = () => {
    setOpenPreview(true);
    // Prepare data for export
    const exportData = asnData.map(({ id, ...row }) => row); // Exclude the 'id' field

    // Extract and capitalize headers
    const headers = Object.keys(exportData[0]).map(
      (header) => header.charAt(0).toUpperCase() + header.slice(1)
    );

    // Create a new array with capitalized headers and the original data
    const capitalizedData = [
      headers,
      ...exportData.map((row) => Object.values(row)),
    ];

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(capitalizedData);
    const sheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Convert sheet to array of arrays
    setSheetData(sheet);
  };

  const handelPrieviewClose = () => {
    setOpenPreview(false);
  };

  const handleAddCustomer = async () => {
    try {
      await apiRequest("customers", "POST", customerDetails);
      setCustomerDetails({});
      setCustomerPopup(false);
      // Refresh customers list
      const response = await apiRequest("customers", "GET");
      const data = await response;
      setCustomers(data);
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };
  // add product model codes here
  const [productDetails, setProductDetails] = useState({
    product_name: "",
    product_code: "",
    sku: "",
    customer_id: "",
    description: "",
  });
  const [productPopup, setProductPopup] = useState(false);

  const handleAddProduct = async () => {
    try {
      await apiRequest("product", "POST", productDetails);
      setProductDetails({});
      setProductPopup(false);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const fetchProducts = async (customer) => {
    try {
      const response = await apiRequest(`product/customer/${customer}`, "GET");
      const data = await response;
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiRequest("customers", "GET");
        const data = await response;
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
    setEmailData({
      ...emailData,
      recipient: selectedCustomer.email
    })
  }, [customer]);

  const handleCustomerChange = (event) => {
    setCustomer(event.target.value);
    setSelectedCustomer(customers.find(
      (cust) => cust.customer_id === event.target.value
    ))


    fetchProducts(event.target.value);
  };

  const handelProductChange = (event) => {
    setProduct(event.target.value)
    setSelectedProduct(products.find((prod) => prod.product_id === event.target.value))
  }

  // const selectedProduct = products.find((prod) => prod.product_id === product);


  const genrateAsn = async () => {
    const data = [];
    for (let i = 0; i < totalPallets; i++) {
      data.push({
        id: i + 1,
        contract: selectedCustomer.contract_number,
        supplier: selectedCustomer.supplier_number,
        sku: selectedProduct.sku,
        qty: quantity,
        delivery: deliveryDate,
        expirey: expireyDate,
        reference,
        batchId: batchId,
        palletNr: `${palletLetter}${Number(palletStartNr) + i}`,
        SSCC: "",
      });
    }
    setAsnData(data);
  };

  const handleResetField = (rowId) => {
    setAsnData((prevList) =>
      prevList.map((row) => (row.id === rowId ? { ...row, SSCC: "" } : row))
    );
  };

  const handleEdit = (id, field, value) => {
    setAsnData((prevList) =>
      prevList.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleBarcodeScan = (e, rowId, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let scannedValue = e.target.value.trim();
      if (scannedValue.startsWith("00")) {
        scannedValue = scannedValue.slice(2); // Remove the first two characters
      }
      if (scannedValue) {
        // Replace the old value with the new scanned value
        setAsnData((prevList) => {
          const updatedList = prevList.map((row) =>
            row.id === rowId ? { ...row, SSCC: scannedValue } : row
          );

          return updatedList;
        });

        // Auto-focus the next SSCC field
        const nextField = ssccRefs.current[index + 1];
        if (nextField) {
          nextField.focus();
        }
      }
    }
  };

  const reset = () => {
    setOpenEmail(false)
    setOpenPreview(false)
    setEmailData({
      recipient: "",
      subject: "",
      text: ""
    })
    setAsnData([])
    setSelectedCustomer("")
    setSelectedProduct("")
    setCustomer('')
    setProduct([])
    setBatchId('')
    setReference('')
    setDeliveryDate('')
    setExpireyDate('')
    setPalletLetter('')
    setTotalPallets('')
    setPalletStartNr('')
    setQuantity('')
    setSheetData([])
  }

  const handleExport = async () => {
    setOpenPreview(true);
    if (!deliveryDate) {
      alert("Please enter a Delivery Date before exporting.");
      return;
    }

    // Format delivery date as DDMMYYYY
    const delivery = new Date(deliveryDate);
    const formattedDate = `${String(delivery.getDate()).padStart(
      2,
      "0"
    )}${String(delivery.getMonth() + 1).padStart(
      2,
      "0"
    )}${delivery.getFullYear()}`;

    // Prepare data for export
    const exportData = asnData.map(({ id, ...row }) => row); // Exclude the 'id' field

    // Extract and capitalize headers
    const headers = Object.keys(exportData[0]).map(
      (header) => header.charAt(0).toUpperCase() + header.slice(1)
    );

    // Create a new array with capitalized headers and the original data
    const capitalizedData = [
      headers,
      ...exportData.map((row) => Object.values(row)),
    ];

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(capitalizedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate file name
    const fileName = `${formattedDate}HFP.xlsx`;

    // Write the Excel file
    XLSX.writeFile(workbook, fileName);

    // Convert workbook to a Blob (binary large object) to send it to the API
    const excelBlob = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBlob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // Convert Blob to File
    const file = new File([blob], fileName, { type: blob.type });

    // Create a FormData object
    const formData = new FormData();
    formData.append("file", blob, fileName); // Append the file with its name
    formData.append("recipient", emailData.recipient); // Replace with the actual recipient
    formData.append("subject", emailData.subject); // Subject of the email
    formData.append("message", emailData.text); // Message body

    try {
      // Send the file to the API
      const response = await apiRequest("email", "POST", formData)
      alert(response.message);
      reset()
    } catch (error) {
      console.error("Error sending file:", error);
      alert("Failed to send email. Please try again.");
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          boxShadow: "2px 0 5px rgba(0, 0, 0, 0.2)",
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            boxShadow: "2px 0 5px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100px",
            overflow: "auto",
          }}
        >
          <img src={logo} alt="logo" style={{ width: "80%", height: "auto" }} />
        </Box>
        <Divider />
        <Box
          sx={{
            overflow: "auto",
            flexGrow: 1,
            p: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          <FormControl fullWidth sx={{ mb: 2 }} size="small" required>
            <InputLabel id="customer-select-label">Select Customer</InputLabel>
            <Select
              labelId="customer-select-label"
              id="customer-select"
              value={customer}
              label="Select Customer"
              onChange={handleCustomerChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {customers.map((cust) => (
                <MenuItem key={cust?.customer_id} value={cust?.customer_id}>
                  {cust?.customer_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }} size="small" required>
            <InputLabel id="product-select-label">Select Product</InputLabel>
            <Select
              labelId="product-select-label"
              id="product-select"
              value={product}
              label="Select Product"
              onChange={handelProductChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {products.map((prod) => (
                <MenuItem key={prod?.product_id} value={prod?.product_id}>
                  {prod?.product_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            id="quantity-text"
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Quantity"
            name="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Reference"
            name="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Batch ID"
            name="batchId"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Delivery Date"
            type="date"
            name="deliveryDate"
            InputLabelProps={{ shrink: true }}
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Expirey Date"
            type="date"
            name="expireyDate"
            InputLabelProps={{ shrink: true }}
            value={expireyDate}
            onChange={(e) => setExpireyDate(e.target.value)}
            required
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Pallet Letter"
            name="palletLetter"
            value={palletLetter}
            onChange={(e) => setPalletLetter(e.target.value)}
            required
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Pallet Start Nr"
            name="palletStartNr"
            type="number"
            value={palletStartNr}
            onChange={(e) => setPalletStartNr(e.target.value)}
            required
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            label="Total Pallets"
            name="totalPallets"
            type="number"
            value={totalPallets}
            onChange={(e) => setTotalPallets(e.target.value)}
            required
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={genrateAsn}
          >
            Generate ASN
          </Button>

          {/* Add sidebar content here */}
        </Box>
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mb: 1 }}
            onClick={handleClickOpen}
          >
            Add Customer
          </Button>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={() => setProductPopup(true)}
          >
            Add Product
          </Button>
        </Box>
      </Drawer>

      {/* this section will use as main container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: 3,
          height: "100vh",
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mx: 4 }}>
          ASN LIST
        </Typography>

        {/* Add main content here */}

        <Container maxWidth="100%" sx={{ my: 5, mx: 1, height: "100%" }}>
          <TableContainer
            component={Paper}
            sx={{
              height: "85%",
              overflow: "auto",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Contract
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Supplier
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    SKU
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Quantity
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Delivery
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Reference
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Expiry
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Batch ID
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    Pallet Number
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                    SSCC
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asnData.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.contract}</TableCell>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell>{row.sku}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.qty}
                        onChange={(e) =>
                          handleEdit(row.id, "qty", e.target.value)
                        }
                      />
                    </TableCell>

                    <TableCell>{row.delivery}</TableCell>
                    <TableCell>{row.reference}</TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={row.expirey}
                        onChange={(e) => handleEdit(row.id, "expirey", e.target.value)}
                        required
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                    <TextField
                        size="small"
                        value={row.batchId}
                        onChange={(e) =>
                          handleEdit(row.id, "batchId", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.palletNr}
                        onChange={(e) =>
                          handleEdit(row.id, "palletNr", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        sx={{ minWidth: 250 }}
                        value={row.SSCC}
                        placeholder="Scan Barcode"
                        onChange={(e) =>
                          handleEdit(row.id, "SSCC", e.target.value)
                        }
                        inputRef={(el) => (ssccRefs.current[index] = el)}
                        onKeyDown={(e) => handleBarcodeScan(e, row.id, index)}
                      />
                      {row.SSCC && (
                        <>
                          <IconButton
                            color="success"
                            onClick={() => alert("Field is valid")}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleResetField(row.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            style={{ marginTop: "20px" }}
            onClick={handelPrieviewOpen}
          >
            Send File
          </Button>
        </Container>
      </Box>

      {/* Add customer popup content here */}
      <Dialog open={customerPopup} onClose={handleClose}>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To add a new customer, please enter the customer details here.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="customer_name"
            name="customer_name"
            label="Customer Name"
            type="text"
            fullWidth
            variant="outlined"
            value={customerDetails.customer_name}
            onChange={handleChange}
            size="small"
          />
          <TextField
            margin="dense"
            id="contract_number"
            name="contract_number"
            label="Contract Number"
            type="text"
            fullWidth
            variant="outlined"
            value={customerDetails.contract_number}
            onChange={handleChange}
            size="small"
          />
          <TextField
            margin="dense"
            id="supplier_number"
            name="supplier_number"
            label="Supplier Number"
            type="text"
            fullWidth
            variant="outlined"
            value={customerDetails.supplier_number}
            onChange={handleChange}
            size="small"
          />
          <TextField
            margin="dense"
            id="email"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={customerDetails.email}
            onChange={handleChange}
            size="small"
          />
          <TextField
            margin="dense"
            id="phone_number"
            name="phone_number"
            label="Phone Number"
            type="text"
            fullWidth
            variant="outlined"
            value={customerDetails.phone_number}
            onChange={handleChange}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddCustomer}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add product popub content here */}
      <Dialog open={productPopup} onClose={() => setProductPopup(false)}>
        <DialogTitle>Add Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To add a new product, please enter the product details here.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="product_name"
            name="product_name"
            label="Product Name"
            type="text"
            fullWidth
            variant="outlined"
            value={productDetails.product_name}
            onChange={(e) =>
              setProductDetails({
                ...productDetails,
                product_name: e.target.value,
              })
            }
            size="small"
            required
          />

          <TextField
            required
            margin="dense"
            id="product_code"
            name="product_code"
            label="Product Code"
            type="text"
            fullWidth
            variant="outlined"
            value={productDetails.product_code}
            onChange={(e) =>
              setProductDetails({
                ...productDetails,
                product_code: e.target.value,
              })
            }
            size="small"
          />
          <TextField
            required
            margin="dense"
            id="sku"
            name="sku"
            label="Product SKU"
            type="text"
            fullWidth
            variant="outlined"
            value={productDetails.sku}
            onChange={(e) =>
              setProductDetails({
                ...productDetails,
                sku: e.target.value,
              })
            }
            size="small"
          />

          <FormControl fullWidth size="small" margin="dense" required>
            <InputLabel id="customer-select-label">Select Customer</InputLabel>
            <Select
              variant="outlined"
              labelId="customer-select-label"
              id="customer_id"
              name="customer_id"
              value={productDetails.customer_id}
              label="Select Customer"
              onChange={(e) =>
                setProductDetails({
                  ...productDetails,
                  customer_id: e.target.value,
                })
              }
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {customers.map((cust) => (
                <MenuItem key={cust?.customer_id} value={cust?.customer_id}>
                  {cust?.customer_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Product Description"
            type="text"
            fullWidth
            variant="outlined"
            value={productDetails.description}
            onChange={(e) =>
              setProductDetails({
                ...productDetails,
                description: e.target.value,
              })
            }
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductPopup(false)}>Cancel</Button>
          <Button onClick={handleAddProduct}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* excel sheet file confirmation box */}
      <Dialog
        open={openPreview}
        onClose={handelPrieviewClose}
        fullWidth
        maxWidth="md"
        style={{
          width: "100%",
        }}
      >
        <DialogTitle>Excel Preview</DialogTitle>
        <DialogContent dividers sx={{ overflow: "hidden" }}>
          {/* Render Excel Sheet in Dialog */}
          <HotTable
            data={sheetData}
            colHeaders={true}
            rowHeaders={true}
            width="100%"
            height="500"
            licenseKey="non-commercial-and-evaluation"
            style={{ margin: "auto" }}
          />
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpenEmail(true)}

          >
            Confirmed
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handelPrieviewClose}
          >
            Denied
          </Button>
        </DialogActions>
      </Dialog>

      {/* email dialog Box */}
      <Dialog open={openEmail} onClose={() => setOpenEmail(false)}>
        <DialogTitle>Email</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Fill in the details to send an email.
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="Recipient Email"
            type="email"
            name="recipient"
            fullWidth
            variant="outlined"
            value={emailData.recipient}
            onChange={handleEmailChange}
            required
          />
          <TextField
            margin="dense"
            label="Subject"
            type="text"
            name="subject"
            fullWidth
            variant="outlined"
            value={emailData.subject}
            onChange={handleEmailChange}
          />
          <TextField
            margin="dense"
            label="Message"
            type="text"
            name="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={emailData.text}
            onChange={handleEmailChange}
          />

        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
          <Button
            variant="contained"
            color="primary"
            onClick={handleExport}
          >
            Save & Send
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenEmail(false)}
          >
            cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}

export default App;
