|Confidential<br><br>Copyright reserved Please turn over<br><br>MARKS: 150 TIME: 3 hours<br><br>This question paper consists of 31 pages, 2 data pages, 2 pages for planning and a separate information sheet.<br><br>![image 1](<2025_information_technology_p1_images/imageFile1.png>)<br><br>INFORMATION TECHNOLOGY P1 NOVEMBER 2025<br><br>![image 2](<2025_information_technology_p1_images/imageFile2.png>)<br><br>NATIONAL SENIOR CERTIFICATE<br><br>![image 3](<2025_information_technology_p1_images/imageFile3.png>)<br><br>GRADE 12<br><br>![image 4](<2025_information_technology_p1_images/imageFile4.png>)|
|---|


## INSTRUCTIONS AND INFORMATION

- 1. This question paper is divided into FOUR sections. Candidates must answer ALL the questions in ALL FOUR sections.
- 2. Two blank pages have been provided at the end of the question paper, which may be used for planning purposes.
- 3. An information sheet has been provided for you to complete at the end of the examination session. Ensure that ALL the information that you provided is correct and submit the information sheet before you leave the examination room.
- 4. The duration of this examination is three hours. Because of the nature of this examination, it is important to note that you will not be permitted to leave the examination room before the end of the examination session.
- 5. This question paper is set with programming terms that are specific to the Delphi programming language. The Delphi programming language must be used to answer the questions.
- 6. Make sure that you answer the questions according to the specifications that are given in each question. Marks will be awarded according to the set requirements.
- 7. Answer only what is asked in each question. For example, if the question does not ask for data validation, then no marks will be awarded for data validation.
- 8. Your programs must be coded in such a way that they will work with any data and not just the sample data supplied or any data extracts that appear in the question paper.
- 9. Routines, such as search, sort and selection, must be developed from first principles. You may NOT use the built-in features of the Delphi programming language for any of these routines.
- 10. All data structures must be defined by you, the programmer, unless the data structures are supplied.
- 11. You must save your work regularly on the disk/CD/DVD/flash disk you have been given, or on the disk space allocated to you for this examination session.
- 12. Make sure that your examination number appears as a comment in every program that you code, as well as on every event indicated.
- 13. If required, print the programming code of all the programs/classes that you completed. Your examination number must appear on all printouts. You will be given half an hour printing time after the examination session.


- 14. At the end of this examination session, you must hand in a disk/CD/DVD/ flash disk with all your work saved on it OR you must make sure that all your work has been saved on the disk space allocated to you for this examination session. Ensure that all files can be read.2025
- 15. The files that you need to complete this question paper have been provided to you on the disk/CD/DVD/flash disk or on the disk space allocated to you. The files are provided in the form of password-protected executable files. Do the following:


- • Double click on the following password-protected executable file: DataNov2025.exe
- • Click on the 'Extract' button.
- • Enter the following password: SuSTF@rm2025


Once extracted, the following list of files will be available in the folder DataNov2025:

## Question 1: Question 3:

- Question1_P.dpr

- Question1_P.dproj

- Question1_P.res

- Question1_U.dfm

- Question1_U.pas

Beehive_U.pas Question3_P.dpr Question3_P.dproj Question3_P.res Question3_U.dfm

- Question3_U.pas

Question 2: Question 4: ConnectDB_U.pas FarmManagementDB - Copy.mdb FarmManagementDB.mdb MixedFarms.txt Question2_P.dpr Question2_P.dproj Question2_P.res Question2_U.dfm Question2_U.pas

- Question4_P.dpr Question4_P.dproj Question4_P.res Question4_U.dfm Question4_U.pas












- SECTION A


- QUESTION 1: GENERAL PROGRAMMING SKILLS Do the following:


- • Open the incomplete program in the Question 1 folder.
- • Enter your examination number as a comment in the first line of the Question1_U.pas file.
- • Compile and execute the program. The program has no functionality currently. Example of the graphical user interface (GUI):

|![image 5](<2025_information_technology_p1_images/imageFile5.png>)|
|---|


- • Complete the code for each section of QUESTION 1, as described in QUESTION 1.1 to QUESTION 1.5.


## 1.1 Button [1.1 - Increase value]

The panel pnlQ1_1 currently displays an integer value that must be increased by the value of 1 when the button is clicked.

Write code to do the following:

- • Extract the integer value displayed on the panel pnlQ1_1.
- • Increase the extracted value by the value of 1.
- • Display the increased value on the panel pnlQ1_1.


Example of output after the button was clicked and the extracted value was increased by the value of 1:

|![image 6](<2025_information_technology_p1_images/imageFile6.png>)|
|---|


NOTE: Each time the user clicks on the 'Increase value' button, the current

value displayed on the panel should be increased by the value of 1. Example of output after the second click of the button:

|![image 7](<2025_information_technology_p1_images/imageFile7.png>)|
|---|


## 1.2 Button [1.2 - Volume]

The image below shows a figure of a three-dimensional shape which has sides of equal length. The length of each side is represented by the letter 𝒙𝒙.

|![image 8](<2025_information_technology_p1_images/imageFile8.png>)|
|---|


(4)

The formula to calculate the volume of the figure is as follows:

𝑉𝑉𝑉𝑉𝑉𝑉𝑉𝑉𝑉𝑉𝑉𝑉 = 𝟓𝟓(𝟑𝟑+𝟏𝟏𝟏𝟏 𝟓𝟓) 𝒙𝒙𝟑𝟑 where 𝒙𝒙 represents the length of the sides of the figure. The user must select the length of 𝒙𝒙 from the spin edit spnQ1_2. Write code to do the following:

- • Extract the length of the side (𝒙𝒙), from the spin edit spnQ1_2.
- • Calculate the volume of the figure using the provided formula and at least TWO DIFFERENT pre-defined mathematical functions.
- • Display the volume in the edit box edtQ1_2, formatted to TWO decimal places.


Example of output if the value of 6 was selected as the length of 𝒙𝒙:

|![image 9](<2025_information_technology_p1_images/imageFile9.png>)|
|---|


Example of output if the value of 10 was selected as the length of 𝒙𝒙:

|![image 10](<2025_information_technology_p1_images/imageFile10.png>)|
|---|


## 1.3 Button [1.3 - Shopping aisle]

A local grocery store uses a coding system to help customers find aisles with specific categories of food. Each category of food is represented by a single alphabet letter. The alphabet letters used and the categories of food that the letters represent are given in the table below.

|ALPHABET LETTER|CATEGORY DESCRIPTION|
|---|---|
|F|Fruit and vegetables|
|D|Dairy|
|B|Butchery|
|S|Sauces|
|P|Pasta and rice|


The user must enter a code in the edit box edtQ1_3 in the following format: <Aisle number>#<Alphabet letter> Example: 12#F refers to aisle 12 which stocks fruit and vegetables.

(6)

Write code to do the following:

- • Extract the code that was entered from edit box edtQ1_3.
- • Separate the aisle number and the alphabet letter that represent the food category from the code that was entered.
- • Use a case statement and the alphabet letter from the code, and save the correct category description in a variable.
- • Display 'Aisle', the aisle number, a colon character (:), followed by a space and the correct category description on label lblQ1_3 in the format: Aisle <Aisle number>: <Category description>


Example of output if the code 12#F was entered:

|![image 11](<2025_information_technology_p1_images/imageFile11.png>)|
|---|


Example of output if the code 3#S was entered:

|![image 12](<2025_information_technology_p1_images/imageFile12.png>)|
|---|


NOTE: You may assume that the code entered is valid. (11)

## 1.4 Button [1.4 - Populate and display]

The declaration of an array called arrNumbers, which consists of NINE elements of type integer, has been provided.

Write code to do the following:

- • Assign a random number in the range from 1 to 15 (inclusive) to each element of array arrNumbers.
- • Use the memo component memQ1_4 to display the random numbers from array arrNumbers separated by dash (-) characters.


Example of output:

|![image 13](<2025_information_technology_p1_images/imageFile13.png>)|
|---|


NOTE: The output displayed by your program may differ from the example of

output as the numbers have been generated randomly. (8)

## 1.5 Button [1.5 - Determine HCF]

The flowchart below illustrates how to determine the highest common factor (HCF) of any TWO positive integers.

![image 14](<2025_information_technology_p1_images/imageFile14.png>)

The user must enter integer values for Num1 and Num2. Code has been provided to:

- • Extract and save the two integer values Num1 and Num2 in iNum1 and iNum2 respectively, and
- • Initialise iHCF to zero (0) Write code to do the following:
- • Code the steps provided in the flowchart to determine the HCF of the two numbers entered.
- • Display the HCF in edit box edtQ1_5. Example of output if the numbers 6 and 4 were entered:


|![image 15](<2025_information_technology_p1_images/imageFile15.png>)|
|---|


Example of output if the numbers 27 and 36 were entered:

|![image 16](<2025_information_technology_p1_images/imageFile16.png>)|
|---|


|• Enter your examination number as a comment in the first line of the program file.<br>• Save your program.<br>• Print the code if required.<br>|
|---|


(11)

## TOTAL SECTION A: 40

- SECTION B


- QUESTION 2: DATABASE PROGRAMMING


|A service provider needs to manage a collection of small farms of various farm types, such as Poultry, Livestock and Dairy. Each farm is owned by only one (a single) farm owner, while one farm owner can own many farms.<br><br>A database called FarmManagementDB.mdb has been developed, which contains two tables called tblFarmOwners and tblFarms.|
|---|


The data pages attached at the end of the question paper provide information on the design of the database and its contents.

Do the following:

- • Open the incomplete project file called Question2_P.dpr in the Question 2 folder.
- • Add your examination number as a comment in the first line of the Question2_U.pas file.
- • Compile and execute the program. The program has limited functionality currently. The contents of the tables are displayed, as shown below on the selection of tab sheet 2.2 - Delphi code.


|![image 17](<2025_information_technology_p1_images/imageFile17.png>)|
|---|


The relationship between the two tables tblFarmOwners and tblFarms is shown below.

|![image 18](<2025_information_technology_p1_images/imageFile18.png>)|
|---|


- • Follow the instructions below to complete the code for each section, as described in QUESTION 2.1 and QUESTION 2.2.
- • Use SQL statements to answer QUESTION 2.1 and Delphi code to answer QUESTION 2.2.


## NOTE:

- • The 'Restore databaseꞌ button is provided to restore the data contained in the database to the original content.
- • Code is provided to link the GUI components to the database. Do NOT change any of the code provided.
- • TWO variables are declared as global variables, as described in the table below.


|Variable|Data type|Description|
|---|---|---|
|tblFarmOwners|TADOTable|Refers to the table tblFarmOwners|
|tblFarms|TADOTable|Refers to the table tblFarms|


- 2.1 Tab sheet [2.1 - SQL] Example of the graphical user interface (GUI) for QUESTION 2.1:


|![image 19](<2025_information_technology_p1_images/imageFile19.png>)|
|---|


## NOTE:

- • Use ONLY SQL statements to answer QUESTION 2.1.1 to QUESTION 2.1.5.
- • Code to execute the SQL statements and display the results of the queries has been provided. The SQL statements assigned to the variables sSQL1, sSQL2, sSQL3, sSQL4 and sSQL5 are incomplete.


Complete the SQL statements to perform the tasks described in QUESTION 2.1.1 to QUESTION 2.1.5 below.

## 2.1.1 Button [2.1.1 - Farm details]

Display the FarmName, NearestTown and SizeInHectares of all farms, sorted in descending order according to SizeInHectares.

Example of output of the first three records:

|![image 20](<2025_information_technology_p1_images/imageFile20.png>)|
|---|


## 2.1.2 Button [2.1.2 - Contact details]

Display the FullName and ContactNumber of all farm owners whose e-mail addresses have not been saved in the table tblFarmOwners.

Example of output:

|![image 21](<2025_information_technology_p1_images/imageFile21.png>)|
|---|


## 2.1.3 Button [2.1.3 - Average farm size]

The average size of all the farms of the selected farm type must be calculated and saved in a new field called AverageSize.

Code has been provided to extract and save the selected farm type from the combo box cmbQ2_1_3 in a variable sFarmType.

Display the FarmType and the AverageSize, formatted to TWO decimal places.

Example of output if Livestock was selected as the farm type:

|![image 22](<2025_information_technology_p1_images/imageFile22.png>)|
|---|


## 2.1.4 Button [2.1.4 - Young farm owners]

Display the FullName, DateOfBirth and Age (calculated field) of all farm owners who are 25 years or younger. The current system date must be used to calculate the age as an integer value.

Use the formula below to calculate the age of the farm owners:

𝐶𝐶𝑉𝑉𝐶𝐶𝐶𝐶𝑉𝑉𝐶𝐶𝐶𝐶 𝑠𝑠𝑠𝑠𝑠𝑠𝐶𝐶𝑉𝑉𝑉𝑉 𝑑𝑑𝑑𝑑𝐶𝐶𝑉𝑉 − 𝐷𝐷𝑑𝑑𝐶𝐶𝑉𝑉𝐷𝐷𝐷𝐷𝐷𝐷𝐷𝐷𝐶𝐶𝐶𝐶ℎ 365

𝐴𝐴𝐴𝐴𝑉𝑉 =

(3)

(2)

(6)

Example of output:

|![image 23](<2025_information_technology_p1_images/imageFile23.png>)|
|---|


NOTE: The format of the date of birth may differ from this example

due to the settings on your computer. (7)

## 2.1.5 Button [2.1.5 - Multiple farms in KZN]

Display the FullName and the total number of farms of each farm owner who owns more than one farm in the Durban or Pietermaritzburg area. The total number of farms must be saved in a new field called TotalFarms.

Example of output:

|![image 24](<2025_information_technology_p1_images/imageFile24.png>)|
|---|


(7)

- 2.2 Tab sheet [2.2 - Delphi code] Example of the graphical user interface (GUI) for QUESTION 2.2:


|![image 25](<2025_information_technology_p1_images/imageFile25.png>)|
|---|


## NOTE:

- • Use ONLY Delphi programming code to answer QUESTION 2.2.
- • NO marks will be awarded for SQL statements in QUESTION 2.2. Button [2.2 – Mixed-farm type]


A mixed-farm type refers to a farm with a combination of different types of farming activities, such as poultry and dairy. Farmers will need to request to be changed to a mixed-farm type, if they qualify for it. Only farms larger than 100 hectares qualify to be a mixed-farm type.

A text file called MixedFarms.txt, which contains a list of FarmIDs of the farms that could possibly qualify to be a mixed-farm type, has been provided.

The first THREE lines of text in the MixedFarms.txt text file are shown below.

|![image 26](<2025_information_technology_p1_images/imageFile26.png>)|
|---|


The program must update the farm type to 'Mixed' if the farm qualifies to be a mixed farm. If the farm does NOT qualify, display the FarmID, FarmName and SizeInHectares of the farm in the rich edit redQ2_2 component.

Code has been provided to clear the rich edit redQ2_2 component and display a suitable heading.

Write code to do the following:

- • Test if the text file MixedFarms.txt exists and display a suitable message using a ShowMessage dialog box if the text file does not exist.
- • If the text file exists, read each FarmID from the text file.


- o Identify the farm in the tblFarms table.
- o Test if the farm is more than 100 hectares in size:


- - If true, update the FarmType field of the farm to 'Mixed'.
- - Otherwise, display the FarmID, FarmName and SizeInHectares of the farm in the rich edit redQ2_2 component, in the format shown in the example on the next page.


Example of records in the tblFarms table before the FarmType was changed:

|![image 27](<2025_information_technology_p1_images/imageFile27.png>)|
|---|


Example of records in the tblFarms table after the FarmType was changed:

|![image 28](<2025_information_technology_p1_images/imageFile28.png>)|
|---|


Example of output of farms listed in the text file that do not qualify to be a mixedfarm type:

|![image 29](<2025_information_technology_p1_images/imageFile29.png>)|
|---|


|• Enter your examination number as a comment in the first line of the program file.<br>• Save your program.<br>• Print the code if required.<br>|
|---|


(15)

## TOTAL SECTION B: 40

- SECTION C


- QUESTION 3: OBJECT-ORIENTATED PROGRAMMING


|During warm seasons honey is regularly harvested from a beehive. A beehive harvesting tracker is used to monitor and check the health status of a beehive colony.|
|---|


Do the following:

- • Open the incomplete program in the Question 3 folder.
- • Open the incomplete object class Beehive_U.pas.
- • Enter your examination number as a comment in the first line of both the Question3_U.pas file and the Beehive_U.pas file.
- • Compile and execute the program. The program has limited functionality currently. Example of the graphical user interface (GUI):
- • Complete the code as specified in QUESTION 3.1 and QUESTION 3.2.


|![image 30](<2025_information_technology_p1_images/imageFile30.png>)|
|---|


- 3.1 The provided incomplete object class (TBeehive) contains the declaration of six attributes, which describe a Beehive object. The attributes of a Beehive object have been declared as follows:


|Attribute|Type|Description|
|---|---|---|
|fBeehiveID|String|An ID used to identify the beehive|
|fBeeCount|Integer|The approximate number of bees in the beehive|
|fPests|Boolean|Indicates whether pests were found in the beehive during the last harvest|
|fNoOfHarvests|Integer|Number of harvests completed in the beehive|
|fTotalHoneyHarvested|Real|The total amount of honey, in kilograms, harvested from the beehive|
|fHarvestDates|String|A concatenated string indicating all the dates on which the hive has been harvested so far, each date on a new line|


The following methods have been provided:

- • A completed method setPests that will change the current status of the fPests attribute
- • A completed toString method


Complete the code in the object class as described in QUESTION 3.1.1 to QUESTION 3.1.5.

- 3.1.1 Write code for a constructor method to receive THREE parameters for the fBeehiveID, fBeeCount and fPests attributes.

Assign the parameters to the respective attributes and set the remaining attributes to the following values:

fNoOfHarvests = 2 fTotalHoneyHarvested = 80 fHarvestDates = '2025/01/05' + #13 + '2025/06/23' (4)

- 3.1.2 Write code for an accessor method called getNoOfHarvests to return the fNoOfHarvests attribute. (2)
- 3.1.3 Write code for a method called calcAverage to return the average amount of honey harvested in the hive, using the formula below.


𝑇𝑇𝑉𝑉𝐶𝐶𝑑𝑑𝑉𝑉 ℎ𝑉𝑉𝐶𝐶𝑉𝑉𝑠𝑠 ℎ𝑑𝑑𝐶𝐶𝐴𝐴𝑉𝑉𝑠𝑠𝐶𝐶𝑉𝑉𝑑𝑑 𝑁𝑁𝑉𝑉𝑉𝑉𝑁𝑁𝑉𝑉𝐶𝐶 𝑉𝑉𝐷𝐷 ℎ𝑑𝑑𝐶𝐶𝐴𝐴𝑉𝑉𝑠𝑠𝐶𝐶𝑠𝑠 (4)

𝐴𝐴𝐴𝐴𝑉𝑉𝐶𝐶𝑑𝑑𝐴𝐴𝑉𝑉 =

- 3.1.4 Write code for a method called updateBeehiveDetails that receives a parameter value for the amount of honey harvested as a real value. Write code to do the following:

- • Add the parameter value to the fTotalHoneyHarvested attribute.
- • Increment the fNoOfHarvests attribute by one.
- • Add (join) the code for a new line (#13) and the system date to the content of the fHarvestDates attribute. (6)


- 3.1.5 Write code for a method called checkHealthStatus to return a Boolean value TRUE which indicates that the beehive is healthy, or FALSE if the beehive is not healthy.


The following criteria must be met for the status of the beehive to be healthy:

- • The number of bees must be more than 7 000 OR the number of harvests must be less than or equal to 3.
- • There must be no pests in the beehive. (6)


- 3.2 An incomplete program has been supplied in the Question 3 folder. The program contains code for the object class to be accessible and declares an object variable called objBeehive.


Code has been provided in the FormCreate method to disable button btnQ3_2_3 and format the rich edit redQ3_2 component.

Write code to perform the tasks described in QUESTION 3.2.1 to QUESTION 3.2.5.

## 3.2.1 Button [3.2.1 - Instantiate beehive object]

Before harvesting honey from a beehive, the user must enter the details of the beehive.

Code has been provided to do the following:

- • Clear the rich edit redQ3_2 component.
- • Extract the beehive ID from combo box cmbQ3.
- • Extract the number of bees from spin edit spnQ3.
- • Extract the pest status from checkbox chbQ3.


Write code to do the following:

- • Use the information extracted to instantiate the objBeehive object.
- • Display the details of the object in the rich edit redQ3_2 using the given toString method.


Example of input and output:

|![image 31](<2025_information_technology_p1_images/imageFile31.png>)|
|---|


## 3.2.2 Button [3.2.2 - Ready to harvest?]

The health status of the beehive will need to be checked before a new harvest takes place.

Write code to do the following:

- • Call the checkHealthStatus method and display a suitable message in the label lblQ3_2_2 to indicate whether the beehive is healthy (ready to harvest) or not healthy (not ready to harvest).
- • If the beehive is ready to harvest, enable button btnQ3_2_3.
- • If the beehive is NOT ready to harvest, disable button btnQ3_2_3.


(5)

Example of output if the beehive is ready to harvest:

|![image 32](<2025_information_technology_p1_images/imageFile32.png>)|
|---|


Example of output if the beehive is NOT ready to harvest:

|![image 33](<2025_information_technology_p1_images/imageFile33.png>)|
|---|


## 3.2.3 Button [3.2.3 - Honey harvested]

The amount of honey harvested during a new harvest must be added to the total amount of honey harvested from the beehive.

Code has been provided to clear the rich edit redQ3_2 component. Write code to do the following:

- • Extract the amount of honey harvested from the edit box edtQ3_2_3.
- • Call the updateBeehiveDetails method using the amount of honey as an argument.
- • Display the following in the redQ3_2 component:


o The number of harvests in the format: 'Harvest number: ' <Number of harvests> o The updated details of the beehive using the toString method

(4)

Example of output if the honey harvested during the new harvest was 67,1 kg and the number of completed harvests is three:

|![image 34](<2025_information_technology_p1_images/imageFile34.png>)|
|---|


## 3.2.4 Button [3.2.4 - Average honey harvested]

Write code to call the relevant method to display the average amount of honey harvested from the beehive in a ShowMessage dialog box, formatted to TWO decimal places.

Example of output if the total amount of honey after three harvests was 147,1 kg:

|![image 35](<2025_information_technology_p1_images/imageFile35.png>)|
|---|


## 3.2.5 Button [3.2.5 - Change status of pests]

The status of pests in the beehive must be changed, depending on whether pests have been detected or not.

A method called setPests has been provided in the object class that will change the current status of pests in the beehive.

Write code to do the following:

- • Call the setPests method.
- • Disable the button btnQ3_2_3.


(4)

(3)

Example of the disabled 'Honey harvested' button when the user clicked on the 'Change status of pests' button once:

|![image 36](<2025_information_technology_p1_images/imageFile36.png>)|
|---|


|• Enter your examination number as a comment in the first line of the object class and the form class.<br>• Save your program.<br>• Print the code in the object class and the form class if required.<br>|
|---|


(2)

## TOTAL SECTION C: 40

- SECTION D


- QUESTION 4: PROBLEM-SOLVING PROGRAMMING


|SustainaFarm Collective is a company that does research on sustainable farming practices in areas where different types of crops have been planted.|
|---|


Do the following:

- • Open the incomplete program in the Question 4 folder.
- • Enter your examination number as a comment in the first line of the Question4_U.pas file.
- • Compile and execute the program. The program has limited functionality currently. Example of the graphical user interface (GUI):

|![image 37](<2025_information_technology_p1_images/imageFile37.png>)|
|---|


- • Complete the code for each section of QUESTION 4, as described in QUESTION 4.1 and QUESTION 4.2.


4.1 The SustainaFarm Collective monitors the soil composition across ten hectares of farmland, recording the percentage values for clay, sand and silt in the soil per hectare.

You have been provided with the following:

- • A completed Display procedure
- • Declarations for the following arrays:


- o A populated one-dimensional array of type string where each element of the array represents the amount of clay, sand and silt in the soil:

arrSoil: array[1..10] of String = ('20:50:10', '40:30:30', '30:28:30', '60:20:20', '25:30:45', '50:40:10', '30:55:15', '45:35:20', '35:0:55', '55:25:20');

- o A two-dimensional array of type real: arr2DSoil: array[1..10, 1..3] of Real;


## 4.1.1 Button [4.1.1 - Extract]

Write code to extract the Clay, Sand and Silt values from the arrSoil array for each hectare and store them in the provided twodimensional array arr2DSoil.

Code has been provided to do the following:

- • Clear the rich edit component redQ4_1.
- • Call the Display method to output the data in the arr2DSoil twodimensional array in the rich edit component redQ4_1.


Example of output:

|![image 38](<2025_information_technology_p1_images/imageFile38.png>)|
|---|


(8)

## 4.1.2 Button [4.1.2 - Validate]

It is essential for the SustainaFarm Collective that the sum of the Clay, Sand and Silt values for each hectare is equal to the value of 100.

Code has been provided to clear the redQ4_1 component and to display the heading 'Hectares adjusted'.

Write code to do the following:

- • Calculate the sum of the Clay, Sand and Silt values for each hectare.
- • If the sum for any hectare does not add up to the value of 100, do the following:


- o Adjust the Clay, Sand and Silt values in the same ratio for that hectare to ensure that the sum of the three values add up to 100.
- o Display the hectare number in the redQ4_1 component in the format:


Hectare: <hectare number> NOTE: Assume that the total for each hectare will not exceed 100. Code has been provided to do the following:

- • Display the heading 'Updated data:'.
- • Call the Display method to output the data of the arr2DSoil two-


dimensional array in the rich edit component redQ4_1. Example of output:

|![image 39](<2025_information_technology_p1_images/imageFile39.png>)|
|---|


(9)

## 4.2 Button [4.2 - Nutrient markers]

The SustainaFarm Collective is researching crop growth potential using unique nutrient markers. Nutrient markers are special numbers where the sum of the factorials of their digits equals the number itself.

- Example 1:

The number 145 is a nutrient marker since the sum of the factorials of the digits equals the original number 145.

1! = 1 x 1 = 1

- 4! = 4 × 3 × 2 × 1 = 24
- 5! = 5 × 4 × 3 × 2 × 1 = 120


- 1 + 24 + 120 = 145

Example 2: The number 32 is NOT a nutrient marker.

3! = 3 x 2 x 1 = 6

- 2! = 2 × 1 = 2 6 + 2 = 8 ≠ 32




Code has been provided to do the following:

- • Clear the memo component memQ4_2.
- • Display the underlined heading 'Nutrient markers:'. Write code to do the following:
- • Determine all the nutrient markers in the range from 1 to 50 000 (inclusive).
- • Display each nutrient marker in the memo component memQ4_2.


Example of output:

|![image 40](<2025_information_technology_p1_images/imageFile40.png>)|
|---|


|• Enter your examination number as a comment in the first line of the program file.<br>• Save your program.<br>• Make a printout of the code if required.<br>|
|---|


TOTAL SECTION D: GRAND TOTAL:

(13)

30 150

INFORMATION TECHNOLOGY P1 DATABASE INFORMATION FOR QUESTION 2: The design of the database tables is as follows: Table: tblFarmOwners This table contains the details of farm owners.

|Field name|Data type|Description|
|---|---|---|
|OwnerID (PK)|Number|Unique identifier for the farm owner|
|FullName|Text (20)|Full name of the farm owner|
|ContactNumber|Text (12)|Contact number of the farm owner|
|Email|Text (25)|E-mail address of the farm owner|
|DateOfBirth|Date/Time|Date of birth of the farm owner|


Example of the first nine records of the tblFarmOwners table:

|![image 41](<2025_information_technology_p1_images/imageFile41.png>)|
|---|


Table: tblFarms This table contains the details of each farm.

|Field name|Data type|Description|
|---|---|---|
|FarmID (PK)|Number|Unique identifier for each farm|
|FarmName|Text (20)|Name of the farm|
|NearestTown|Text (20)|The town nearest to the farm|
|SizeInHectares|Number|Size of the farm in hectares|
|FarmType|Text (10)|Type of farm (e.g. Dairy, Poultry, Mixed)|
|OwnerID (FK)|Number|The owner ID of the farm owner|


Example of the first eleven records of the tblFarms table:

|![image 42](<2025_information_technology_p1_images/imageFile42.png>)|
|---|


## NOTE:

- • Connection code has been provided.
- • The database is password-protected; therefore, you will not be able to access the database directly.


The following one-to-many relationship with referential integrity exists between the two tables in the database:

|![image 43](<2025_information_technology_p1_images/imageFile43.png>)|
|---|


Examination sticker

_______

# 150

INFORMATION TECHNOLOGY P1 – NOVEMBER 2025 INFORMATION SHEET (to be completed by the candidate AFTER the 3-hour session)

CENTRE NUMBER: ______________________________________________________ EXAMINATION NUMBER: _________________________________________________ WORK STATION NUMBER: ________________________________________________

Version of Delphi used during the INFORMATION TECHNOLOGY NSC NOV. 2025 Examination:

|Mark appropriate box with a cross (X)|Delphi 2010|Delphi XE|Delphi 10.3|Delphi Community|Delphi 11|Delphi 12|Other: (Specify) ________|
|---|---|---|---|---|---|---|---|


FOLDER NAME: _________________________________________________________

Candidate must tick if the file name(s) used for each answer has been saved and/or attempted.

|Question number|File name|Saved ()|Attempted ()|Maximum Mark|Mark Achieved|Marker Code|
|---|---|---|---|---|---|---|
|1|Question1_P. dproj| | |40| | |
|2|Question2_P. dproj| | |40| | |
|3|Beehive_U. pas| | |22| | |
| |Question3_P. dproj| | |18| | |
|4|Question4_P. dproj| | |30| | |
|TOTAL| | | |150| | |


Comment: (for office/marker use only)

______________________________________________________________________ ______________________________________________________________________

