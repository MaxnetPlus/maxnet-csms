# Sales pages base stucture 


1. sales page ini nantinya hanya akan dapat digunakan oleh user yang memiliki user access "sales" atau user role sales dan juga dapat digunakan oleh pengguna lain yang memiliki access "sales"

2. sales page ini memiliki layout sediri dan memiliki tampilan yang lebih di orientasikan ke mobile apps

3. sales pages ini memiliki route sendiri yaitu routes/sales.php

4. saat ini ada 2 buah menu utama yang ada dan dapat digunakan di sales pages dan nantinya mungkin akan dapat bertambah/berkurang

5. menu yang ada dan digunakan saat ini adalah fitur follow up customer sesuai dengan sales id yang dapat di gunakan.

6. lalu terdapat menu customer prospects yang berfungsi untuk melakukan pencacatan prospect customer yang akan masuk yang nantinya akan terdapat field input yang akan di inputkan sales diantara lain adalah : sales_id (sales yang merekomendasikan belongs to user model), customer_name, customer_email, customer_number, adresses, coordinate. untuk coordinate pastikan sales mengaktifkan izin gps dan tampilkan peta dari open street (sudah saya install) dan sales akan meletakkan marker disana

7. pada halaman sales ini nantinya terdapat fitur point untuk masing masing sales yang mendapatkan prospect, fitur point ini nantinya akan di atur oleh admin pada halaman da layout admin, sales setiap harinya memiliki target harian dan juga target bulanan dengan total point yang diakumulasi akan di hitung dan direset di akhir bulan dengan tetap menambahkan target point harian untuk masing masing sales.

8. fitur target harian ini nantinya dapat di akumulasi sesuai dengan target harian terakhir kali dan target pada hari ini, contoh sales A pada hari sabtu mendapatnakn point 12 padahal target point yang wajib di dapatkan per hari dari sales A adalah 10 point maka point akan di akumulasi di hari berikutnya saat sales masuk, maka pada hari senin sales akan langsung mendapatkan 2 point dari hari terakhir dia masuk. lalu contoh kedua semisal dari hari senin tadi sales hanya mendapatkan total 5 prospek dan di jumlah dengan prospek dari hari kemarin maka ia mendaopatkan total 7 point maka pada hari berikutnya yaitu hari selasa maka total point nya akan menjadi -3 karena target harian pada hari kemarin belum terpenuhi (mirip seperti misi harian). tapi dengan akumulasi yang akan tetap di lakukan dan reset di akhir bulan (tambahkan juga fitur tracking performa bulanan)

8. prospect memiliki kategori dengan jumlah poin yang berbeda beda untuk setiap prospect customer yang didapatkan (sesuai dengan kategori, sebagai contoh untuk custoemr biasa akan mendapatkan satu poin dan untuk custoemr perusahaan ia akan mendapatkan 2 point)

# Instruksi

1. bantu saya membuat layout dan routing tersendiri untuk akses sales dan pastikan layout ini responsive (dapt di gunakan di mobile dan destop) dengan lebih condong ke tampilan yang lebih mobile friendly

2. gunakan komponen komponen dari shadcn, dan buat komponent baru jika membutuhkan komponent lain tanpa merubah komponent yang sudah ada saat ini

3. sesuaikan juga halaman admin saya dengan menambahkan halaman management sales, prospect dan juga manajement prospek

4. sesuaikan struktur file seperti struktur yang saat ini saya miliki (contoh: pada setiap folder komponent halmaan terdapat file component seperti Index, Create, List, dan lain lain)

5. saya menggunakan spatie dengan struktur seperti pada seeder yang sudah saya buat dan gunakan

6. route untuk halaman sales ini akan berada di routes/sales.php

7. buatkan saya seeder baru jika anda ingin menambahkan hak akses atau role baru dan juga buatkan saya migrasi yang diperlukan dan pastikan menggunakan command php artisan make:migration

8. selalu buat dengan tampilan ui yang modern dan menggunakan base warna yang sesuai dengan app.css saya dan juga pastikan kompitabilitas nya dengan mode terang maupun mode gelap