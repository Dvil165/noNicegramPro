/*
 1. req handler là gì? middleware và controller đều là req handler 
    
 2. error handler là gì? nơi mình dồn lỗi về để xử lí
    
 3. throw error(hoặc kể cả errorWithStatus) trong schema: 422
    
    lỗi đó sẽ bị lưu lại vào req, và mình có hàm validate (demo) để xử lí
    lỗi đó sẽ ko đc đi xuống dưới đâu, mà đi vào hàm validate
    trong quá trình đó những lỗi khác 422 sẽ đc xử lí
    còn lại 1 cục 422 sẽ đc gửi đi 1 lần

 4. throw error(hoặc kể cả errorWithStatus) trong 1 hàm bth khác gì hàm async
    hàm bth thì không sao cả
    còn với async thì nó sẽ bị lỗi:
    wrapAsync: chạy hàm trong hàm có sẵn cấu trúc try catch

 5. Khác nhau giữa throw error và errorWithStatus
            error               |       errorWithStatus
    name, message và stack      | message và  status
    mình ko muốn client đọc đc  | nhớ bỏ status đi                           
    stack, dùng omit của lodash |
    loại đi                     |
    Cờ của message
    enumer của nó là false
    quy về true, để nó hiện lỗi |
    
 6. file errors:
    định nghĩa lỗi theo ý mình














*/
