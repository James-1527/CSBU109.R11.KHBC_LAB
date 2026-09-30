const fs = require('fs');
const xml2js = require('xml2js');

// === Bước 2: Tạo một đối tượng JavaScript ===
const productData = {
  id: "PROD-1001",
  name: "Sony WH-1000XM5 Bluetooth Headphones",
  price: 8500000,
  inStock: true,
  categories: ["Audio", "Electronics", "Wireless"],
  supplier: {
    name: "Sony Vietnam",
    contact: "support@sony.com.vn"
  }
};

// === Bước 2: Chuyển JS object thành JSON ===
const jsonString = JSON.stringify(productData, null, 2);
console.log("=== 1. FORMATTED JSON STRING ===");
console.log(jsonString);

// Ghi JSON vào file product.json
fs.writeFileSync('product.json', jsonString, 'utf8');
console.log("✓ Đã ghi file product.json\n");

// === Bước 4: Chuyển JS object thành XML ===
const builder = new xml2js.Builder({ rootName: 'Product' });
const xmlData = builder.buildObject(productData);
console.log("=== 2. CONVERTED TO XML FORMAT ===");
console.log(xmlData);

// Ghi XML vào file product.xml
fs.writeFileSync('product.xml', xmlData, 'utf8');
console.log("✓ Đã ghi file product.xml\n");

// === Bước 5: Đọc file XML và parse lại thành JS object ===
fs.readFile('product.xml', 'utf8', (err, data) => {
  if (err) throw err;
  
  xml2js.parseString(data, { explicitArray: false }, (err, result) => {
    if (err) throw err;
    console.log("=== 3. XML FILE PARSED BACK INTO A JS OBJECT ===");
    console.log(result.Product);
    console.log(`\n✓ Tên sản phẩm được parse: ${result.Product.name}`);
    
    // Gọi hàm validateAndMerge (Extended Requirement)
    validateAndMerge('product.json');
  });
});

// === EXTENDED REQUIREMENT: Validate và merge dữ liệu ===
function validateAndMerge(jsonPath) {
  console.log("\n=== 4. VALIDATE & MERGE (EXTENDED) ===");
  
  // Đọc file product.json
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const product = JSON.parse(rawData);
  
  // Kiểm tra giá hợp lệ (phải > 0)
  if (typeof product.price === 'number' && product.price > 0) {
    console.log(`✓ Giá hợp lệ: ${product.price} VND`);
    
    // Tính giá sau khi giảm 10%
    product.discountPrice = product.price * 0.9;
    console.log(`✓ Giá sau giảm 10%: ${product.discountPrice} VND`);
    
    // Ghi lại file product_final.json
    const finalJson = JSON.stringify(product, null, 2);
    fs.writeFileSync('product_final.json', finalJson, 'utf8');
    console.log(`✓ Đã ghi file product_final.json`);
    console.log(product);
  } else {
    console.log("✗ Giá không hợp lệ!");
  }
}