/**
 * GenderDetector - Inferred Gender and Pronoun Detection for Candidate Profiles
 * Utilizes pronoun parsing and comprehensive name-to-gender dictionaries
 * covering Western, Indian, Asian, and international first names.
 */

const FEMALE_PRONOUNS_REGEX = /\b(she\/her|she\/her\/hers|she \/ her|she\/hers)\b/i;
const MALE_PRONOUNS_REGEX = /\b(he\/him|he\/him\/his|he \/ him|he\/his)\b/i;
const NON_BINARY_PRONOUNS_REGEX = /\b(they\/them|they\/them\/theirs|they \/ them)\b/i;

// Comprehensive First Name Lookup
// High-confidence female first names
const FEMALE_NAMES = new Set([
  // Common Indian / South Asian female names
  'aadhya', 'aanya', 'aarti', 'aarushi', 'aayushi', 'abha', 'aditi', 'advika', 'ahilya', 'aishwarya',
  'akanksha', 'akhila', 'akshara', 'akshita', 'alankrita', 'alisha', 'alka', 'amala', 'ambika', 'amita',
  'amrita', 'anamika', 'ananya', 'anchal', 'anindita', 'anita', 'anjali', 'anjana', 'ankita', 'annapurna',
  'anokhi', 'anshita', 'anshu', 'antara', 'anupama', 'anuradha', 'anushka', 'anwesha', 'aparajita', 'aparna',
  'archana', 'arpita', 'arti', 'aruna', 'arundhati', 'arushi', 'arya', 'asavari', 'asha', 'ashlesha',
  'ashna', 'ashruti', 'ashwini', 'asmita', 'avni', 'avantika', 'ayushi', 'barkha', 'basanti', 'bela',
  'bhagyalakshmi', 'bhairavi', 'bhakti', 'bhanu', 'bharati', 'bhavana', 'bhavani', 'bhavya', 'bhumi', 'bhumika',
  'bina', 'bindu', 'chaitali', 'chaitra', 'chameli', 'champa', 'chandan', 'chandana', 'chandani', 'chandini',
  'chandra', 'charu', 'charul', 'charulata', 'chavi', 'chaya', 'chetana', 'chhavi', 'chitra', 'chitralekha',
  'daamini', 'daksha', 'damini', 'darshana', 'daya', 'deepa', 'deepali', 'deepam', 'deepanwita', 'deepashri',
  'deepika', 'deepti', 'devaki', 'devangana', 'devanshi', 'devashree', 'deveshi', 'devika', 'devyani', 'dhani',
  'dhara', 'dharini', 'dharitri', 'dharti', 'dhriti', 'dhruvi', 'dimple', 'diksha', 'dipika', 'dipti',
  'disha', 'dishani', 'divija', 'divya', 'divyanshi', 'dolly', 'drishti', 'durga', 'dwiti', 'ekata',
  'ekta', 'ela', 'eshana', 'eshita', 'falak', 'falguni', 'farah', 'farida', 'fatima', 'ganga',
  'gargi', 'gauri', 'gayatri', 'geeta', 'geetanjali', 'geetika', 'ginni', 'gita', 'gitika', 'gopika',
  'gouri', 'gowri', 'gul', 'gunjan', 'hansika', 'harini', 'haripriya', 'harita', 'harsha', 'harshada',
  'harshita', 'heena', 'hema', 'hemal', 'hemalata', 'hemali', 'himani', 'hira', 'hiral', 'hiranmayi',
  'hitakshi', 'hridya', 'ila', 'ina', 'indu', 'indira', 'indrani', 'ipsita', 'isha', 'ishani',
  'ishita', 'iswari', 'jagriti', 'jahnavi', 'janki', 'janvi', 'jaya', 'jayanti', 'jayaprada', 'jayashree',
  'jeeya', 'jharna', 'jheel', 'jigna', 'jignasa', 'jinal', 'jisha', 'jiva', 'jivi', 'jivika',
  'joshita', 'jovita', 'juhi', 'jyoti', 'jyotika', 'jyotsna', 'kadambari', 'kajal', 'kajol', 'kalavati',
  'kalindi', 'kalyani', 'kamakshi', 'kamala', 'kamalini', 'kamini', 'kanak', 'kanchan', 'kanika', 'kanta',
  'kanti', 'karishma', 'kashish', 'kashmira', 'kashvi', 'kasturi', 'kaumudi', 'kausalya', 'kaveri', 'kavita',
  'kavya', 'keerthana', 'keerthi', 'keshavi', 'ketaki', 'khushi', 'khyati', 'kimaya', 'kiran', 'kiranmayi',
  'kirti', 'kishori', 'kiara', 'kokila', 'komal', 'komali', 'kopal', 'kratika', 'krina', 'kripa',
  'krishnaa', 'kriti', 'kritika', 'krupa', 'krupali', 'kruti', 'kshama', 'kshipra', 'kumari', 'kumkum',
  'kumud', 'kuntal', 'kunti', 'kusum', 'laboni', 'lajja', 'lajwanti', 'lakshmi', 'lalita', 'lata',
  'latika', 'lavanya', 'leela', 'leena', 'lekha', 'lipika', 'lochan', 'lochana', 'lopa', 'lopamudra',
  'madhavi', 'madhu', 'madhulika', 'madhumita', 'madhura', 'madhuri', 'mahathi', 'maheep', 'maheshwari', 'mahika',
  'mahima', 'maina', 'maitri', 'mala', 'malathi', 'malati', 'malavika', 'malini', 'mallika', 'mamata',
  'mamtha', 'manali', 'manasi', 'mandakini', 'mandira', 'mangal', 'mangala', 'manini', 'manisha', 'manjari',
  'manju', 'manjula', 'manjulika', 'manjusha', 'manorama', 'mansi', 'manu', 'marina', 'mitali', 'mayuri',
  'meena', 'meenakshi', 'meera', 'megha', 'meghana', 'mehak', 'mili', 'mina', 'minakshi', 'mira',
  'mithila', 'mohini', 'mona', 'monika', 'mridula', 'mrinal', 'mrinali', 'mrinalini', 'mrunal', 'mrunalini',
  'mukta', 'mukul', 'mythili', 'naina', 'nandana', 'nandini', 'nandita', 'naomi', 'natasha', 'navya',
  'neelam', 'neelanjana', 'neelima', 'neena', 'neeraja', 'neeru', 'neeta', 'neetu', 'neha', 'nidha',
  'nidhi', 'nikita', 'nilam', 'nima', 'nimesha', 'nimisha', 'nirmala', 'nirupama', 'nisha', 'nishita',
  'nistha', 'nita', 'niti', 'nitika', 'nitya', 'nivedita', 'niyati', 'noor', 'nupur', 'nutan',
  'ojasvi', 'ojaswini', 'padma', 'padmaja', 'padmavati', 'palak', 'pallavi', 'pankaja', 'parineeta', 'pari',
  'paromita', 'parul', 'parvati', 'payal', 'pooja', 'poonam', 'poorva', 'prabha', 'prachi', 'pragati',
  'pragya', 'pranjal', 'prarthana', 'prasanna', 'prashanthi', 'pratibha', 'pratiksha', 'pratima', 'pratyusha', 'preet',
  'preeti', 'prema', 'prerna', 'priya', 'priyanka', 'pujita', 'punita', 'purnima', 'purva', 'rachana',
  'radha', 'radhika', 'ragini', 'rajalakshmi', 'rajani', 'rajashree', 'rajeshwari', 'rajni', 'rakhi', 'rakshita',
  'ramya', 'rani', 'ranjana', 'rashmi', 'ratna', 'raveena', 'reeni', 'reenu', 'reet', 'reeta',
  'rekha', 'renu', 'renuka', 'richa', 'ridhima', 'rimjhim', 'rina', 'rinkal', 'rinku', 'rishika',
  'rita', 'ritu', 'rituparna', 'riya', 'roheena', 'rohini', 'roma', 'roopa', 'roopali', 'roshni',
  'ruchika', 'ruchira', 'ruchi', 'rupa', 'rupali', 'rupinder', 'sabita', 'sadhana', 'safia', 'sagari',
  'sailaja', 'sakshi', 'saloni', 'samata', 'sameera', 'samhita', 'samidha', 'samiksha', 'samira', 'samriddhi',
  'samyuktha', 'sandhya', 'sangeeta', 'sanghamitra', 'sanjana', 'sanjukta', 'sanvi', 'sanyukta', 'sapna', 'sarada',
  'sarala', 'saranya', 'saraswati', 'sarika', 'sarita', 'saroj', 'sarojini', 'sarvamangala', 'sasmita', 'saujanya',
  'saumya', 'savita', 'savitri', 'sayali', 'sayantani', 'seema', 'shabana', 'shabnam', 'shachi', 'shailaja',
  'shaili', 'shalini', 'shambhavi', 'shamita', 'shanta', 'shanti', 'sharada', 'sharmila', 'sharmistha', 'shashi',
  'shashikala', 'shatabdi', 'sheela', 'sheetal', 'shefali', 'shikha', 'shilpa', 'shilpi', 'shipra', 'shivangi',
  'shivani', 'shobha', 'shobhana', 'shobhita', 'shraddha', 'shravani', 'shravya', 'shree', 'shreya', 'shrishti',
  'shruthi', 'shruti', 'shubha', 'shubhangi', 'shweta', 'shyama', 'sidhi', 'simi', 'simran', 'sindhu',
  'sireesha', 'sirisha', 'smita', 'smitha', 'smriti', 'sneha', 'snehal', 'snigdha', 'sohini', 'somya',
  'sonal', 'sonali', 'sonam', 'sonia', 'soumya', 'soundarya', 'spandana', 'sravani', 'sravya', 'sridevi',
  'srilatha', 'srushti', 'stuti', 'subbalakshmi', 'subhadra', 'subhasree', 'suchandra', 'sucharita', 'sucheta', 'suchitra',
  'sudha', 'sudharani', 'sugandha', 'sujata', 'sujatha', 'sukanya', 'sukriti', 'sulekha', 'sulochana', 'suman',
  'sumana', 'sumathi', 'sumati', 'sumedha', 'sumita', 'sumitra', 'sunaina', 'sunanda', 'sunayana', 'sundari',
  'sunidhi', 'sunita', 'suniti', 'suparna', 'supriti', 'supriya', 'surabhi', 'surbhi', 'surekha', 'sushama',
  'sushila', 'sushma', 'sushmita', 'suvarna', 'swapna', 'swapnika', 'swarna', 'swaroopa', 'swati', 'swetha',
  'tanmayee', 'tanu', 'tanuja', 'tanushree', 'tanvi', 'tanya', 'tapasya', 'tarani', 'tarini', 'tarla',
  'taru', 'taruna', 'teena', 'teesta', 'tejaswi', 'tejaswini', 'trupti', 'trisha', 'tulasi', 'tulika',
  'uma', 'umadevi', 'upama', 'upasana', 'upma', 'urmila', 'urvashi', 'usha', 'ushakiran', 'ushee',
  'utpala', 'utsavi', 'uttara', 'vaidehi', 'vaishali', 'vaishnavi', 'vandana', 'vandita', 'vanita', 'varsha',
  'varuni', 'vasanta', 'vasanti', 'vasudha', 'vasundhara', 'veda', 'vedavati', 'vedika', 'veena', 'vibha',
  'vidhi', 'vidisha', 'vidya', 'vijaya', 'vijayalakshmi', 'vimala', 'vinata', 'vinaya', 'vinita', 'viraja',
  'vrinda', 'vritti', 'yamini', 'yasmin', 'yashasvi', 'yashoda', 'yashodhara', 'yojana', 'yukti', 'yuvika',

  // Western / International female names
  'abigail', 'ada', 'adelaide', 'adele', 'adeline', 'adriana', 'adrienne', 'agatha', 'agnes', 'aileen',
  'aimee', 'alana', 'alanna', 'alba', 'alberta', 'alessandra', 'alexa', 'alexandra', 'alexia', 'alexis',
  'alice', 'alicia', 'alina', 'alisa', 'alison', 'allison', 'alyssa', 'amalia', 'amanda', 'amber',
  'amelia', 'amie', 'amy', 'ana', 'anabel', 'anastasia', 'andrea', 'angela', 'angelica', 'angelina',
  'angeline', 'ann', 'anna', 'annabel', 'annabella', 'annabelle', 'anne', 'annette', 'annie', 'annika',
  'antoinette', 'antonia', 'anya', 'april', 'ariana', 'arianna', 'ariel', 'ariella', 'arlene', 'ashley',
  'astrid', 'athena', 'audra', 'audrey', 'aurelia', 'aurora', 'autumn', 'ava', 'avery', 'barbara',
  'beatrice', 'beatrix', 'belinda', 'bella', 'bernadette', 'bernice', 'bertha', 'beth', 'bethany', 'betsy',
  'betty', 'beverly', 'bianca', 'blair', 'blake', 'bonnie', 'brenda', 'brenna', 'briana', 'brianna',
  'bridget', 'bridgette', 'brielle', 'brittany', 'brittney', 'brooke', 'brooklyn', 'brynn', 'caitlin', 'caitlyn',
  'camila', 'camilla', 'camille', 'candace', 'candice', 'cara', 'carina', 'carla', 'carly', 'carmela',
  'carmen', 'carol', 'carole', 'carolina', 'caroline', 'carolyn', 'carrie', 'cassandra', 'cassidy', 'catherine',
  'cathleen', 'cathy', 'cecilia', 'cecelia', 'celeste', 'celia', 'charlene', 'charlotte', 'chelsea', 'cheryl',
  'chloe', 'christa', 'christi', 'christie', 'christina', 'christine', 'claire', 'clara', 'clare', 'clarissa',
  'claudia', 'clementine', 'colette', 'colleen', 'constance', 'cora', 'corinne', 'courtney', 'cristina', 'crystal',
  'cynthia', 'daisy', 'dakota', 'dana', 'daniela', 'daniella', 'danielle', 'daphne', 'dara', 'darcy',
  'darlene', 'dawn', 'deanna', 'debbie', 'debora', 'deborah', 'debra', 'delaney', 'delilah', 'demi',
  'denise', 'desiree', 'destiny', 'diana', 'diane', 'dianna', 'dianne', 'dina', 'dixie', 'dolly',
  'dolores', 'dominique', 'dona', 'donna', 'dora', 'doreen', 'doris', 'dorothy', 'eden', 'edith',
  'edna', 'eileen', 'elaina', 'elaine', 'eleanor', 'elena', 'eliana', 'elisa', 'elisabeth', 'elise',
  'eliza', 'elizabeth', 'ella', 'elle', 'ellen', 'ellie', 'elois', 'eloise', 'elsa', 'elsie',
  'elvira', 'elyse', 'ember', 'emely', 'emerald', 'emerson', 'emery', 'emilia', 'emilie', 'emily',
  'emma', 'emmaline', 'erica', 'erika', 'erin', 'esme', 'esperanza', 'estella', 'estelle', 'esther',
  'estella', 'ethel', 'eugenia', 'eunice', 'eva', 'evangeline', 'eve', 'evelyn', 'everly', 'evie',
  'faith', 'faye', 'felicia', 'felicity', 'fiona', 'flora', 'florence', 'frances', 'francesca', 'francine',
  'gabriela', 'gabriella', 'gabrielle', 'gail', 'gemini', 'gemma', 'genevieve', 'georgia', 'georgina', 'geraldine',
  'gia', 'giana', 'gianna', 'gillian', 'gina', 'ginger', 'giselle', 'gladys', 'glenda', 'gloria',
  'grace', 'gracie', 'greta', 'gretchen', 'gwen', 'gwendolyn', 'hailey', 'haley', 'hanna', 'hannah',
  'harley', 'harlow', 'harmony', 'harper', 'harriet', 'hattie', 'haven', 'hayden', 'hayley', 'hazel',
  'heather', 'heidi', 'helen', 'helena', 'helene', 'hillary', 'hollie', 'holly', 'hope', 'ida',
  'ilene', 'iliana', 'iman', 'imogen', 'ina', 'inaya', 'ines', 'ingrid', 'irene', 'iris',
  'irma', 'isabel', 'isabela', 'isabella', 'isabelle', 'isla', 'isobel', 'ivy', 'jackie', 'jacqueline',
  'jacquelyn', 'jada', 'jade', 'jaime', 'jamie', 'jana', 'jane', 'janelle', 'janet', 'janice',
  'janie', 'janine', 'jasmin', 'jasmine', 'jayda', 'jayla', 'jayne', 'jean', 'jeanette', 'jeanie',
  'jeanne', 'jeannette', 'jeannie', 'jenna', 'jennifer', 'jenny', 'jessica', 'jessie', 'jill', 'jillian',
  'jo', 'joan', 'joann', 'joanna', 'joanne', 'jocelyn', 'jodi', 'jodie', 'jody', 'joelle',
  'johanna', 'jolene', 'jolie', 'jordan', 'jordyn', 'josephine', 'josie', 'joy', 'joyce', 'juana',
  'judith', 'judy', 'julia', 'juliana', 'julianna', 'julie', 'juliet', 'juliette', 'june', 'juniper',
  'justine', 'kaitlin', 'kaitlyn', 'kara', 'kareena', 'karen', 'kari', 'karina', 'karla', 'karly',
  'karyn', 'kasey', 'kate', 'katelyn', 'katelynn', 'katerina', 'katharine', 'katherine', 'kathleen', 'kathryn',
  'kathy', 'katia', 'katie', 'katrina', 'katy', 'kay', 'kayla', 'kaylee', 'kayleigh', 'keira',
  'kelly', 'kelsey', 'kendra', 'kennedy', 'keri', 'kerri', 'kerry', 'kia', 'kiana', 'kiara',
  'kim', 'kimberley', 'kimberly', 'kirsten', 'kirsty', 'kourtney', 'krista', 'kristen', 'kristi', 'kristie',
  'kristin', 'kristina', 'kristine', 'krystal', 'kylah', 'kylee', 'kylie', 'lacey', 'laci', 'lacie',
  'ladonna', 'laila', 'lana', 'lara', 'larissa', 'latoya', 'laura', 'laurel', 'lauren', 'laurie',
  'lauryn', 'layla', 'lea', 'leah', 'leann', 'leanna', 'leanne', 'lee', 'leila', 'leilani',
  'lena', 'leona', 'lesley', 'leslie', 'leticia', 'lexi', 'lexie', 'lia', 'liana', 'libby',
  'liberty', 'lila', 'lilah', 'lilia', 'lilian', 'liliana', 'lillian', 'lilly', 'lily', 'lina',
  'linda', 'lindsay', 'lindsey', 'lisa', 'lisette', 'liv', 'livia', 'liz', 'liza', 'lizabeth',
  'lizbeth', 'lizette', 'lizzie', 'logan', 'lois', 'lola', 'lora', 'loraine', 'loren', 'lorena',
  'loretta', 'lori', 'lorie', 'lorna', 'lorraine', 'louisa', 'louise', 'lucia', 'luciana', 'lucie',
  'lucille', 'lucinda', 'lucy', 'luisa', 'lulu', 'luna', 'luz', 'lydia', 'lyla', 'lyn',
  'lynda', 'lyndsay', 'lyndsey', 'lynn', 'lynne', 'lynnette', 'mabel', 'macey', 'macie', 'mackenzie',
  'macy', 'maddison', 'maddy', 'madeleine', 'madeline', 'madelyn', 'madge', 'madison', 'madisyn', 'mae',
  'maeve', 'magdalena', 'magdalene', 'maggie', 'magnolia', 'maia', 'maira', 'maisie', 'malia', 'mallory',
  'mandy', 'mara', 'marcelina', 'marcella', 'marci', 'marcia', 'marcie', 'marcy', 'margaret', 'margarita',
  'margaux', 'marge', 'margery', 'margo', 'margot', 'margret', 'marguerite', 'mari', 'maria', 'mariah',
  'mariam', 'marian', 'mariana', 'marianna', 'marianne', 'maribel', 'maricela', 'marie', 'mariel', 'mariela',
  'marilyn', 'marina', 'marion', 'marisa', 'marisela', 'marissa', 'marjorie', 'marla', 'marlene', 'marley',
  'marnie', 'marsha', 'marta', 'martha', 'martina', 'mary', 'maryann', 'maryanne', 'marybeth', 'matilda',
  'maud', 'maude', 'maura', 'maureen', 'mavis', 'maxine', 'may', 'maya', 'mayra', 'mckenna',
  'mckenzie', 'meagan', 'meaghan', 'meg', 'megan', 'meghan', 'melanie', 'melina', 'melinda', 'melissa',
  'melody', 'meredith', 'mia', 'micah', 'michaela', 'michele', 'michelle', 'mikaela', 'mikayla', 'mila',
  'mildred', 'milena', 'miley', 'millicent', 'millie', 'milly', 'mimi', 'mindy', 'minerva', 'minnie',
  'mira', 'miracle', 'miranda', 'miriam', 'missy', 'misty', 'mitzi', 'moira', 'mollie', 'molly',
  'mona', 'monica', 'monique', 'montana', 'morgan', 'moriah', 'muriel', 'mya', 'myah', 'myra',
  'myrna', 'myrtle', 'nadia', 'nadine', 'nancy', 'naomi', 'natalia', 'natalie', 'natasha', 'nelda',
  'nell', 'nellie', 'nicole', 'nicolette', 'nina', 'noelle', 'noemi', 'nola', 'nora', 'norah',
  'norma', 'nova', 'olivia', 'opal', 'ophelia', 'paige', 'paisley', 'pamela', 'patricia', 'patty',
  'paula', 'paulette', 'paulina', 'pauline', 'pearl', 'peggy', 'penelope', 'penny', 'petra', 'phoebe',
  'phyllis', 'piper', 'polly', 'poppy', 'priscilla', 'queen', 'queenie', 'quinn', 'rachel', 'rachelle',
  'rae', 'raegan', 'ramona', 'raquel', 'raven', 'rayna', 'reagan', 'reba', 'rebecca', 'rebekah',
  'reese', 'regan', 'regina', 'renee', 'rhoda', 'rhonda', 'riley', 'rita', 'roberta', 'robin',
  'robyn', 'rochelle', 'rocio', 'romana', 'romi', 'romy', 'rona', 'ronda', 'ronna', 'rosa',
  'rosalie', 'rosalind', 'rosalinda', 'rosalynn', 'rosanna', 'rosanne', 'rose', 'rosella', 'rosemarie', 'rosemary',
  'rosetta', 'rosie', 'roslyn', 'rowan', 'roxana', 'roxane', 'roxanna', 'roxanne', 'roxie', 'roxy',
  'ruby', 'ruth', 'ruthie', 'rylee', 'rylie', 'sabrina', 'sadie', 'sage', 'sally', 'salma',
  'samantha', 'samara', 'sandra', 'sandy', 'sara', 'sarah', 'sasha', 'savanna', 'savannah', 'scarlet',
  'scarlett', 'selena', 'selene', 'selma', 'serena', 'serenity', 'shana', 'shania', 'shanna', 'shannon',
  'shari', 'sharon', 'sharron', 'sharyl', 'shauna', 'shawn', 'shawna', 'shea', 'sheena', 'sheila',
  'shelby', 'shelia', 'shelley', 'shellie', 'shelly', 'sheri', 'sheridan', 'sherri', 'sherrie', 'sherry',
  'sheryl', 'shirley', 'sienna', 'sierra', 'silvia', 'simone', 'sky', 'skye', 'skylar', 'skyler',
  'sofia', 'solana', 'sonia', 'sonja', 'sonya', 'sophia', 'sophie', 'stacey', 'staci', 'stacie',
  'stacy', 'stefanie', 'stella', 'stephanie', 'sue', 'summer', 'susan', 'susana', 'susanna', 'susannah',
  'susanne', 'susie', 'suzanne', 'suzie', 'suzy', 'sydney', 'sylvia', 'tabitha', 'talia', 'tamara',
  'tami', 'tamia', 'tamika', 'tammy', 'tania', 'tanisha', 'tanya', 'tara', 'tarah', 'taryn',
  'tasha', 'tatiana', 'taylor', 'teagan', 'tenley', 'teresa', 'teri', 'terra', 'terri', 'terrie',
  'tess', 'tessa', 'thea', 'thelma', 'theresa', 'therese', 'tia', 'tiana', 'tianna', 'tiara',
  'tiffany', 'tina', 'toni', 'tonia', 'tonya', 'tori', 'tracey', 'traci', 'tracie', 'tracy',
  'tricia', 'trina', 'trish', 'trisha', 'trudi', 'trudie', 'trudy', 'twila', 'tyra', 'ula',
  'valencia', 'valeria', 'valerie', 'vanessa', 'vera', 'veronica', 'vicki', 'vickie', 'vicky', 'victoria',
  'vida', 'vienna', 'viola', 'violet', 'violeta', 'virginia', 'vivian', 'viviana', 'vivienne', 'wanda',
  'waverly', 'wendi', 'wendy', 'whitney', 'willa', 'willow', 'wilma', 'winnie', 'winnifred', 'winter',
  'wynona', 'xena', 'ximena', 'yasmin', 'yasmine', 'yazmin', 'yelena', 'yesenia', 'yolanda', 'yvette',
  'yvonne', 'zahra', 'zara', 'zelda', 'zia', 'zoe', 'zoey', 'zora', 'zuri'
]);

// High-confidence male first names
const MALE_NAMES = new Set([
  // Common Indian / South Asian male names
  'aadi', 'aaditya', 'aakash', 'aamir', 'aarnav', 'aarav', 'aarush', 'aashish', 'abhay', 'abhijeet',
  'abhijit', 'abhilash', 'abhinav', 'abhinaya', 'abhishek', 'achyut', 'adarsh', 'aditya', 'advait', 'advay',
  'agam', 'agastya', 'ajay', 'ajeet', 'ajit', 'ajitesh', 'akash', 'akhil', 'akhilesh', 'akshay',
  'akshit', 'alok', 'aman', 'amar', 'amardeep', 'amarendra', 'amarnath', 'ambuj', 'ameet', 'amey',
  'amit', 'amitabh', 'amitav', 'amogh', 'amol', 'amrit', 'amulya', 'anand', 'ananth', 'anant',
  'aniket', 'anil', 'animesh', 'aniruddha', 'anirudh', 'anish', 'ankit', 'ankur', 'ankush', 'anmol',
  'anoop', 'anshuman', 'anuj', 'anupam', 'anurag', 'anuroop', 'apurv', 'apurva', 'aravind', 'aravinda',
  'archit', 'arif', 'arihant', 'arjun', 'arnab', 'arnav', 'arpan', 'arshad', 'arun', 'arunav',
  'arvind', 'aryan', 'ashfaq', 'ashish', 'ashok', 'ashraf', 'ashutosh', 'ashwin', 'ashwani', 'asif',
  'atal', 'athang', 'atharv', 'athrava', 'atish', 'atul', 'avinash', 'aviral', 'avishek', 'avneesh',
  'ayush', 'ayushman', 'azhar', 'babul', 'badal', 'balaji', 'balakrishna', 'balaram', 'balbir', 'balraj',
  'balram', 'balwant', 'bansi', 'basant', 'bhagat', 'bhagwan', 'bhairav', 'bharat', 'bharath', 'bhargav',
  'bhaskar', 'bhavin', 'bhavesh', 'bheeshma', 'bhim', 'bhisham', 'bhupendra', 'bhupesh', 'bhuvan', 'bijoy',
  'bimal', 'bipin', 'birbal', 'birendra', 'biswajit', 'bodhi', 'brajesh', 'brijesh', 'chaitanya', 'chaman',
  'champak', 'chandan', 'chander', 'chandra', 'chandrakant', 'chandraprakash', 'chandrashekhar', 'charlie', 'chetan', 'chhatrapati',
  'chhotelal', 'chiman', 'chinmay', 'chintan', 'chirag', 'chiranjeev', 'chitranjan', 'chitresh', 'daivik', 'damodar',
  'darpan', 'darshan', 'darshil', 'daya', 'dayanand', 'debajit', 'deepak', 'deepankar', 'deepen', 'deependra',
  'deepesh', 'dev', 'devanand', 'devansh', 'devavrata', 'devdas', 'deven', 'devendra', 'devesh', 'devraj',
  'dhananjay', 'dhanesh', 'dhani', 'dhanraj', 'dharam', 'dharampal', 'dharmendra', 'dharmesh', 'dhaval', 'dheeraj',
  'dhruv', 'dhruva', 'digvijay', 'dilip', 'dinesh', 'dipak', 'dipen', 'dipankar', 'divakar', 'divyansh',
  'divyesh', 'diwakar', 'drish', 'dron', 'durgesh', 'dushyant', 'ekansh', 'eknath', 'eshan', 'faiyaz',
  'farhan', 'firoz', 'gagan', 'gajanan', 'gajendra', 'gandharva', 'ganesh', 'ganpati', 'gaurav', 'gaurang',
  'gautam', 'gautama', 'geet', 'giridhar', 'girish', 'gokul', 'gopal', 'gopi', 'gourab', 'govind',
  'govinda', 'gulab', 'gulshan', 'gunwant', 'gurbachan', 'gurcharan', 'gurdial', 'gurmeet', 'gurmukh', 'gurnam',
  'gurpreet', 'gursharan', 'gurudev', 'gyan', 'gyanendra', 'haider', 'hans', 'hansraj', 'hanuman', 'hardik',
  'hareesh', 'harendra', 'hari', 'harikrishna', 'harinarayan', 'hariprasad', 'harish', 'harit', 'harman', 'harmeet',
  'haroon', 'harsh', 'harshad', 'harshal', 'harshit', 'harshvardhan', 'hasan', 'hassan', 'hemant', 'hemendra',
  'hitendra', 'hitesh', 'hriday', 'hritik', 'hrithik', 'hussain', 'ibrahim', 'ikram', 'ila', 'inder',
  'inderjit', 'inderpal', 'indrajit', 'indranil', 'iqbal', 'irfan', 'ishaan', 'ishan', 'ishwar', 'jagadish',
  'jagannath', 'jagat', 'jagdeep', 'jagdish', 'jagjeet', 'jagjit', 'jai', 'jaideep', 'jaidev', 'jaikishan',
  'jaiprakash', 'jairam', 'jaisal', 'jaisukh', 'jaivardhan', 'jaivant', 'jasbir', 'jaspal', 'jaspreet', 'jaswant',
  'jatin', 'javed', 'jay', 'jayant', 'jayanta', 'jaydeep', 'jaydev', 'jayendra', 'jayesh', 'jayprakash',
  'jeevan', 'jitendra', 'jitesh', 'jivan', 'joginder', 'joy', 'joydeep', 'jugal', 'jwalant', 'kabeer',
  'kabir', 'kailash', 'kalidas', 'kalpesh', 'kalyan', 'kamal', 'kamalakar', 'kamlesh', 'kandarp', 'kanhaiya',
  'kanishk', 'kant', 'kanti', 'kapil', 'karan', 'kartik', 'karthik', 'kartikeya', 'karun', 'kashif',
  'kashinath', 'kaushal', 'kaushik', 'kavi', 'kaviraj', 'kedar', 'kedarnath', 'keerat', 'keshav', 'ketan',
  'keval', 'kewal', 'khalid', 'khurram', 'kinshuk', 'kiran', 'kirat', 'kireet', 'kiriti', 'kishan',
  'kishore', 'kripal', 'krishna', 'krishnamurthy', 'krishnan', 'kshitij', 'kulbhushan', 'kuldeep', 'kulwant', 'kumar',
  'kumaresan', 'kunal', 'kundan', 'kush', 'kushal', 'lakhan', 'lakshman', 'lakshya', 'lalit', 'lav',
  'lochan', 'lokendra', 'lokesh', 'madhav', 'madhavan', 'madhukar', 'madhur', 'madhusudan', 'mahadev', 'mahant',
  'mahavir', 'mahendra', 'mahesh', 'maheshwar', 'mahim', 'mahinder', 'mahipal', 'mahmood', 'makrand', 'manas',
  'manav', 'mandeep', 'mandhar', 'mandip', 'mangal', 'mangesh', 'mani', 'manik', 'manikandan', 'maninder',
  'manish', 'manit', 'manjit', 'manmohan', 'manohar', 'manoj', 'manpreet', 'mansoor', 'manu', 'manvendra',
  'maruti', 'mayank', 'mayur', 'meer', 'meghraj', 'mehboob', 'mehul', 'milind', 'mitesh', 'mithilesh',
  'mithun', 'mitul', 'mohammad', 'mohammed', 'mohan', 'mohit', 'moolchand', 'moti', 'motilal', 'mrinal',
  'mritunjay', 'mrityunjay', 'mudit', 'mukesh', 'mukul', 'murali', 'muralidhar', 'murari', 'murugan', 'mustafa',
  'nachiketa', 'nadeem', 'nadir', 'nagendra', 'nagesh', 'nakul', 'nalin', 'naman', 'namdev', 'namit',
  'nandan', 'nandi', 'nandkishore', 'nandlal', 'nandu', 'narain', 'narasimha', 'narayan', 'narayana', 'narendra',
  'naresh', 'naseem', 'nasser', 'natraj', 'naved', 'naveen', 'navin', 'navneet', 'navraj', 'nawal',
  'nayan', 'neeraj', 'neetish', 'neil', 'nhal', 'nidheesh', 'nihal', 'nikhil', 'nikhilesh', 'nikunj',
  'nilesh', 'nimish', 'ninad', 'nipun', 'niral', 'niranjan', 'nirav', 'nirbhay', 'nirmal', 'nishant',
  'nishi', 'nishikant', 'nishit', 'nitin', 'nitish', 'nived', 'niyant', 'nooh', 'om', 'omkar',
  'omprakash', 'padmanabh', 'palash', 'pallav', 'pankaj', 'panran', 'param', 'paramjit', 'paramveer', 'paras',
  'paresh', 'parikshit', 'paritosh', 'parmeet', 'parth', 'partha', 'parthasarathy', 'parveen', 'pavan', 'pawan',
  'payas', 'peeyush', 'phalguna', 'piyush', 'poorva', 'prabhakar', 'prabhat', 'prabhu', 'prabir', 'prabodh',
  'pradeep', 'pradhuman', 'pradyumna', 'prafull', 'prafulla', 'prahlad', 'prakash', 'pramod', 'pranav', 'pranaya',
  'praneet', 'pranit', 'pranjal', 'prasad', 'prasanna', 'prashant', 'prashanth', 'pratap', 'prateek', 'pratik',
  'pratul', 'praval', 'praveen', 'pravin', 'pravir', 'preetam', 'prem', 'premnath', 'pritpal', 'prithvi',
  'priyadarshan', 'priyanshu', 'pujit', 'pulkit', 'puneet', 'puran', 'puranjay', 'purna', 'pushkar', 'pushpak',
  'raghav', 'raghavan', 'raghavendra', 'raghu', 'raghunandan', 'raghunath', 'raghuram', 'raghuvir', 'rahil', 'rahul',
  'raj', 'raja', 'rajan', 'rajaram', 'rajat', 'rajdeep', 'rajeev', 'rajendra', 'rajesh', 'rajiv',
  'rajkumar', 'rajneesh', 'rajpal', 'raju', 'rajveer', 'rakesh', 'ram', 'raman', 'ramanathan', 'ramchandra',
  'ramdas', 'ramesh', 'rameshwar', 'ramgopal', 'ramkishore', 'ramkumar', 'rammohan', 'ramnarayan', 'ramnik', 'ramprasad',
  'rana', 'ranbir', 'randhir', 'ranganath', 'rangeet', 'ranjan', 'ranjay', 'ranjeet', 'ranjit', 'ranveer',
  'rasbihari', 'rasheed', 'rashid', 'ratan', 'ratnesh', 'ravi', 'ravichandran', 'ravikant', 'ravindra', 'ravish',
  'reshab', 'reva', 'ribhu', 'rishabh', 'rishab', 'rishi', 'rishit', 'ritesh', 'rithvik', 'rituraj',
  'ritvik', 'riyaz', 'rohan', 'rohit', 'ronak', 'ronit', 'roopesh', 'roshan', 'rudra', 'rupak',
  'rupen', 'rupesh', 'rushil', 'sachin', 'sadanand', 'sagar', 'sahil', 'sai', 'saikat', 'sailesh',
  'sajan', 'sajal', 'sajid', 'saket', 'salil', 'salman', 'samar', 'samarendra', 'samarth', 'sameer',
  'samir', 'sampat', 'samrat', 'sandeep', 'sandip', 'sanjay', 'sanjeev', 'sanjiv', 'sankalp', 'sanket',
  'santosh', 'sarang', 'saransh', 'saraswat', 'sarbesh', 'sarfaraz', 'saroj', 'sartaj', 'sarvesh', 'satendra',
  'satish', 'satpal', 'satyajit', 'satyam', 'satyendra', 'saurabh', 'saurav', 'savar', 'sayed', 'sayam',
  'shahid', 'shailendra', 'shailesh', 'shakti', 'shamik', 'shamit', 'shamsher', 'shan', 'shankar', 'shankara',
  'shantanu', 'sharad', 'sharat', 'shardul', 'shariq', 'shashank', 'shashi', 'shashikant', 'shashwat', 'shekhar',
  'sher', 'shikhar', 'shishir', 'shiv', 'shivam', 'shivanand', 'shivendra', 'shivram', 'shobhit', 'shourya',
  'shravan', 'shreehari', 'shreekanth', 'shreekant', 'shreenath', 'shrenik', 'shreyas', 'shridhar', 'shrikant', 'shrinivas',
  'shripad', 'shripal', 'shriram', 'shriyans', 'shubh', 'shubham', 'shyam', 'shyamsundar', 'siddhant', 'siddharth',
  'siddhartha', 'siddhesh', 'siraj', 'skand', 'sneh', 'snehal', 'soham', 'sohan', 'sohel', 'somesh',
  'somnath', 'sonu', 'sougata', 'soumil', 'soumitra', 'sourabh', 'sourav', 'sparsh', 'sreedhar', 'sreekanth',
  'sreenath', 'sreenivas', 'srikant', 'srikanth', 'srinivas', 'srinivasan', 'sriram', 'subhash', 'subodh', 'subroto',
  'sudarshan', 'sudeep', 'suder', 'sudhanshu', 'sudhakar', 'sudhir', 'sudip', 'suhas', 'sujan', 'sujit',
  'sujoy', 'sukant', 'suketu', 'sukhdev', 'sukhvinder', 'sukumar', 'suleman', 'sultan', 'suman', 'sumant',
  'sumanta', 'sumedh', 'sumeet', 'sumit', 'sundar', 'sundaram', 'sunder', 'sunil', 'sunirmal', 'sunny',
  'suraj', 'suranjan', 'suren', 'surendra', 'suresh', 'surinder', 'surya', 'suryakant', 'suryansh', 'sushant',
  'susheel', 'sushil', 'suyash', 'swapnil', 'swaraj', 'swatantra', 'swayam', 'tanay', 'tanmay', 'tapan',
  'tapas', 'tarun', 'tejas', 'tejesh', 'thakur', 'tilak', 'tirth', 'trilok', 'trivikram', 'tuhin',
  'tushar', 'uday', 'udayan', 'udit', 'ujjwal', 'umakant', 'umapathi', 'umar', 'umesh', 'unmesh',
  'upendra', 'utkarsh', 'uttam', 'vaibhav', 'vaidyanath', 'vamsi', 'vamshi', 'vanraj', 'vardhan', 'varun',
  'vasant', 'vasudev', 'vasu', 'ved', 'vedant', 'vedprakash', 'veenu', 'veer', 'veerendra', 'velu',
  'venkat', 'venkatesh', 'venkateshwarlu', 'venu', 'vibhas', 'vibhishan', 'vibhor', 'vicky', 'vidur', 'vidyadhar',
  'vidyut', 'vignesh', 'vijay', 'vijayant', 'vijayendra', 'vikas', 'vikesh', 'vikram', 'vikramaditya', 'vikrant',
  'vilas', 'vimal', 'vinayak', 'vinay', 'vineet', 'vinod', 'vipil', 'vipin', 'viplav', 'vipul',
  'viraj', 'viral', 'virendra', 'virender', 'viren', 'viresh', 'virmani', 'vihaan', 'vihaan', 'vishal',
  'vishesh', 'vishnu', 'vishram', 'vishva', 'vishvajit', 'vishwamitra', 'vishwajeet', 'vishwas', 'vithal', 'vivek',
  'vraj', 'vratin', 'vyan', 'vyas', 'yagnesh', 'yajur', 'yakshit', 'yash', 'yashpal', 'yashraj',
  'yashvardhan', 'yashwant', 'yatin', 'yazid', 'yogendra', 'yogesh', 'yogi', 'yudhishthir', 'yug', 'yuvan',
  'yuvaraj', 'yuvraj', 'zaheer', 'zahir', 'zain', 'zeeshan', 'zia', 'zubair',

  // Western / International male names
  'aaron', 'abdul', 'abdullah', 'abe', 'abel', 'abraham', 'abram', 'adam', 'adan', 'adolfo',
  'adolph', 'adrian', 'aidan', 'aiden', 'alan', 'albert', 'alberto', 'alden', 'alec', 'alejandro',
  'alex', 'alexander', 'alexandre', 'alexis', 'alfonso', 'alfred', 'alfredo', 'ali', 'allan', 'allen',
  'alonso', 'alonzo', 'alphonso', 'alton', 'alvaro', 'alvin', 'amari', 'ammon', 'amos', 'andre',
  'andres', 'andrew', 'andy', 'angel', 'angelo', 'anthony', 'antonio', 'antwan', 'archer', 'archibald',
  'archie', 'ari', 'aric', 'ariel', 'arjun', 'arley', 'arman', 'armando', 'armin', 'arnaldo',
  'arnold', 'arnoldo', 'aron', 'ron', 'art', 'arthur', 'artie', 'arturo', 'arvel', 'asa',
  'ashton', 'aubrey', 'august', 'augustine', 'augusto', 'aurelio', 'austin', 'avery', 'axel', 'bailey',
  'baron', 'barrett', 'barry', 'bart', 'barton', 'basil', 'beau', 'ben', 'benedict', 'benito',
  'benjamin', 'bennett', 'bennie', 'benny', 'bentley', 'benton', 'bernard', 'bernardo', 'bernie', 'bert',
  'bertram', 'bill', 'billie', 'billy', 'blaine', 'blair', 'blake', 'bo', 'bob', 'bobbie',
  'bobby', 'bodhi', 'bode', 'boone', 'boris', 'bowen', 'boyd', 'brad', 'bradford', 'bradley',
  'brady', 'brain', 'branden', 'brandon', 'brant', 'braxton', 'brayden', 'brendan', 'brendon', 'brennan',
  'brent', 'brenton', 'bret', 'brett', 'brian', 'brice', 'brock', 'brody', 'brooks', 'bruce',
  'bruno', 'bryan', 'bryant', 'bryce', 'brycen', 'bryson', 'buddy', 'burt', 'byron', 'cade',
  'caden', 'caleb', 'callum', 'calvin', 'camden', 'cameron', 'camilo', 'carl', 'carlos', 'carlton',
  'carmelo', 'carmen', 'carmin', 'carson', 'carter', 'cary', 'casey', 'casen', 'cash', 'cason',
  'casper', 'cecil', 'cedric', 'cesar', 'chad', 'chadwick', 'chaim', 'chance', 'chandler', 'channing',
  'charles', 'charley', 'charlie', 'chase', 'chester', 'chet', 'chris', 'christian', 'christopher', 'chuck',
  'clarence', 'clark', 'claude', 'claudio', 'clay', 'clayton', 'clement', 'cleo', 'cletus', 'cliff',
  'clifford', 'clifton', 'clint', 'clinton', 'clyde', 'coby', 'cody', 'colby', 'cole', 'coleman',
  'colin', 'collin', 'colt', 'colten', 'colton', 'conner', 'connor', 'conor', 'conrad', 'cooper',
  'corbin', 'corey', 'cormac', 'cornelius', 'cory', 'craig', 'cristian', 'cristobal', 'cruz', 'curt',
  'curtis', 'cyril', 'cyrus', 'dakota', 'dale', 'dallas', 'dalton', 'damian', 'damien', 'damion',
  'damon', 'dan', 'dana', 'dane', 'daniel', 'danny', 'dante', 'darian', 'darien', 'darin',
  'dario', 'darius', 'darnell', 'darrel', 'darrell', 'darren', 'darrin', 'darryl', 'darwin', 'daryl',
  'dave', 'davey', 'david', 'davin', 'davion', 'davis', 'dawson', 'dax', 'daxton', 'dean',
  'declan', 'demarcus', 'demetrius', 'denis', 'dennis', 'denny', 'denver', 'deon', 'derek', 'deric',
  'derick', 'derik', 'derrick', 'deshawn', 'desmond', 'devan', 'devante', 'deven', 'devin', 'devon',
  'dewayne', 'dewey', 'dexter', 'diego', 'dillon', 'dino', 'dion', 'dirk', 'dmitri', 'dolan',
  'dominic', 'dominick', 'dominik', 'don', 'donald', 'donato', 'donavan', 'donell', 'donn', 'donnie',
  'donny', 'donovan', 'dorian', 'doug', 'douglas', 'doyle', 'drake', 'drew', 'duane', 'duke',
  'duncan', 'dustin', 'dusty', 'dwain', 'dwayne', 'dwight', 'dylan', 'earl', 'earle', 'earnest',
  'easton', 'ed', 'eddie', 'eddy', 'edgar', 'edgardo', 'edison', 'edmond', 'edmund', 'edsel',
  'eduardo', 'edward', 'edwardo', 'edwin', 'efrain', 'efren', 'eli', 'elian', 'elias', 'elijah',
  'eliot', 'eliseo', 'elisha', 'elliot', 'elliott', 'ellis', 'elmer', 'elmo', 'eloy', 'elton',
  'elvin', 'elvis', 'elwood', 'emanuel', 'emerson', 'emery', 'emil', 'emilio', 'emmanuel', 'emmett',
  'enoch', 'enrico', 'enrique', 'ephraim', 'eric', 'erich', 'erick', 'erik', 'ernest', 'ernesto',
  'ernie', 'errol', 'ervin', 'erwin', 'esteban', 'ethan', 'eugene', 'evan', 'everett', 'ezekiel',
  'ezra', 'fabian', 'felipe', 'felix', 'ferdinand', 'fernando', 'fidel', 'fletcher', 'floyd', 'flynn',
  'ford', 'forest', 'forrest', 'foster', 'fox', 'fran', 'francesco', 'francis', 'francisco', 'franco',
  'frank', 'frankie', 'franklin', 'fred', 'freddie', 'freddy', 'frederic', 'frederick', 'fredrick', 'fritz',
  'gabe', 'gabriel', 'gael', 'gage', 'garrett', 'garrison', 'garth', 'gary', 'gavin', 'gene',
  'geoffrey', 'george', 'gerald', 'gerard', 'gerardo', 'german', 'gerry', 'gil', 'gilbert', 'gilberto',
  'giles', 'gino', 'giovanni', 'glen', 'glenn', 'gordon', 'grady', 'graham', 'grant', 'grayson',
  'greg', 'gregg', 'gregorio', 'gregory', 'grey', 'griffin', 'grover', 'guido', 'guillermo', 'gunnar',
  'gunner', 'gus', 'gustavo', 'guy', 'haden', 'hakeem', 'hal', 'hank', 'hans', 'harlan',
  'harley', 'harold', 'harris', 'harrison', 'harry', 'harvey', 'hasan', 'hassan', 'hayden', 'hayes',
  'heath', 'hector', 'henri', 'henry', 'herbert', 'heriberto', 'herman', 'hilario', 'homer', 'horace',
  'horacio', 'houston', 'howard', 'hubert', 'hugh', 'hugo', 'humberto', 'hunter', 'ian', 'ibrahim',
  'ignacio', 'igor', 'ike', 'ira', 'irvin', 'irving', 'irwin', 'isaac', 'isaiah', 'isaias',
  'ishmael', 'isidro', 'isiah', 'ismail', 'israel', 'issac', 'ivan', 'ivor', 'jace', 'jack',
  'jackson', 'jacob', 'jacoby', 'jacques', 'jaden', 'jadon', 'jaeger', 'jaime', 'jair', 'jairo',
  'jake', 'jakob', 'jalen', 'jamaal', 'jamal', 'jamar', 'james', 'jameson', 'jamie', 'jamil',
  'jared', 'jaren', 'jarod', 'jarred', 'jarrett', 'jarrod', 'jarvis', 'jase', 'jasen', 'jason',
  'jasper', 'javier', 'javon', 'jaxon', 'jaxson', 'jaxton', 'jay', 'jayce', 'jayden', 'jaydon',
  'jaylan', 'jaylen', 'jaylin', 'jaylon', 'jayson', 'jean', 'jed', 'jedidiah', 'jeff', 'jefferey',
  'jeffery', 'jeffrey', 'jeptha', 'jeremy', 'jeriah', 'jermaine', 'jerome', 'jeromy', 'jerry', 'jesse',
  'jessie', 'jesus', 'jethro', 'jim', 'jimmie', 'jimmy', 'joaquin', 'jocelyn', 'joe', 'joel',
  'joesph', 'joey', 'johan', 'john', 'johnathan', 'johnathon', 'johnnie', 'johnny', 'jon', 'jonah',
  'jonas', 'jonathan', 'jonathon', 'jordan', 'jordon', 'jordy', 'jorge', 'jose', 'josef', 'joseph',
  'josh', 'joshua', 'josiah', 'josue', 'jovan', 'jovani', 'jovany', 'joyce', 'juan', 'judah',
  'judd', 'jude', 'judson', 'jules', 'julian', 'julien', 'julio', 'julius', 'junior', 'justen',
  'justice', 'justin', 'justus', 'kade', 'kaden', 'kai', 'kale', 'kaleb', 'kane', 'kareem',
  'karl', 'karson', 'karter', 'kase', 'kasen', 'kash', 'keanu', 'keaton', 'keegan', 'keenan',
  'keith', 'kellan', 'kellen', 'keller', 'kelvin', 'ken', 'kendall', 'kendrick', 'kenneth', 'kenny',
  'kenton', 'kentrell', 'keon', 'keoni', 'kerry', 'keven', 'kevin', 'khalid', 'khalil', 'kian',
  'kieran', 'killian', 'king', 'kingston', 'kip', 'kirk', 'knox', 'kobe', 'koby', 'kody',
  'kolby', 'kole', 'kolten', 'kolton', 'konner', 'konnor', 'korbin', 'kory', 'kris', 'kristian',
  'kristofer', 'kristopher', 'kurt', 'kurtis', 'kyle', 'kyler', 'kyrie', 'lacey', 'lacy', 'lamar',
  'lamont', 'lance', 'landen', 'landon', 'lane', 'lanier', 'lars', 'lathan', 'latrell', 'laurence',
  'lawrence', 'lawson', 'layne', 'layton', 'lazarus', 'leander', 'lee', 'leif', 'leighton', 'leland',
  'len', 'lennon', 'lennox', 'lenny', 'leo', 'leon', 'leonard', 'leonardo', 'leonel', 'leopold',
  'leroy', 'les', 'leslie', 'lester', 'levi', 'levon', 'lewis', 'liam', 'lincoln', 'linwood',
  'lionel', 'lloyd', 'logan', 'lonnie', 'loren', 'lorenzo', 'lou', 'louie', 'louis', 'luc',
  'luca', 'lucas', 'lucian', 'luciano', 'lucien', 'lucius', 'lucky', 'ludwig', 'luis', 'luka',
  'lukas', 'luke', 'luther', 'lyle', 'lyndon', 'mack', 'madden', 'maddox', 'major', 'makai',
  'malachi', 'malakai', 'malcolm', 'malik', 'manley', 'manuel', 'marc', 'marcel', 'marcellus', 'marcelo',
  'marco', 'marcos', 'marcus', 'mario', 'marion', 'marius', 'mark', 'markus', 'marley', 'marlin',
  'marlon', 'marquis', 'marquise', 'marshall', 'martin', 'marty', 'marvin', 'mason', 'mateo', 'mathew',
  'matias', 'matteo', 'matt', 'matthew', 'matthias', 'maurice', 'mauricio', 'mauro', 'maverick', 'max',
  'maxim', 'maximilian', 'maximiliano', 'maximo', 'maximus', 'maxwell', 'mayer', 'maynard', 'mayson', 'mekhi',
  'mel', 'melvin', 'memphis', 'merle', 'merlin', 'merrill', 'meyer', 'micah', 'michael', 'michal',
  'micheal', 'michel', 'mick', 'mickey', 'miguel', 'mike', 'mikel', 'mikey', 'milan', 'miles',
  'milo', 'milton', 'misael', 'mitch', 'mitchel', 'mitchell', 'mohamed', 'mohammad', 'mohammed', 'moises',
  'monte', 'montgomery', 'monty', 'mordecai', 'morgan', 'morris', 'mortimer', 'morton', 'moses', 'moshe',
  'muhammad', 'murphy', 'mustafa', 'myles', 'myron', 'nash', 'nasir', 'nathan', 'nathanael', 'nathaniel',
  'neal', 'ned', 'nehemiah', 'neil', 'nelson', 'nestor', 'neva', 'newton', 'nicholas', 'nick',
  'nickolas', 'nico', 'nicolas', 'nigel', 'niko', 'nikolai', 'nikolas', 'niles', 'noah', 'noam',
  'noel', 'nolan', 'norbert', 'norman', 'normand', 'norris', 'oakley', 'odie', 'odin', 'olaf',
  'olen', 'oli', 'oliver', 'ollie', 'omar', 'omari', 'orion', 'orlando', 'orval', 'orville',
  'osbaldo', 'osborn', 'osborne', 'oscar', 'osvaldo', 'oswald', 'otis', 'otto', 'owen', 'pablo',
  'pace', 'padraig', 'palmer', 'paolo', 'parker', 'pascal', 'pat', 'patric', 'patrick', 'paul',
  'paulo', 'paxton', 'pedro', 'percival', 'percy', 'perry', 'pete', 'peter', 'peyton', 'phil',
  'philip', 'phillip', 'pierce', 'pierre', 'pierson', 'porfirio', 'porter', 'preston', 'prince', 'quentin',
  'quincy', 'quinn', 'quinton', 'rafael', 'raheem', 'ralph', 'ramiro', 'ramon', 'ramsey', 'randal',
  'randall', 'randell', 'randolph', 'randy', 'raoul', 'raphael', 'rashad', 'rashaun', 'rashawn', 'rasheed',
  'raul', 'ray', 'rayan', 'raymond', 'raymundo', 'reagan', 'red', 'reed', 'reese', 'regan',
  'reggie', 'reginald', 'reid', 'reinaldo', 'remington', 'remy', 'reuben', 'rex', 'reynaldo', 'rhett',
  'rhys', 'ricardo', 'rich', 'richard', 'richie', 'rick', 'rickey', 'ricki', 'rickie', 'ricky',
  'rico', 'rigoberto', 'riley', 'ringo', 'rio', 'riordan', 'rishabh', 'robbie', 'robby', 'robert',
  'roberto', 'robin', 'rocco', 'rocky', 'rod', 'roderick', 'rodger', 'rodney', 'rodolfo', 'rodrigo',
  'rogelio', 'roger', 'rohan', 'roland', 'rolando', 'roman', 'romeo', 'ron', 'ronald', 'ronaldo',
  'ronan', 'ronnie', 'ronny', 'roosevelt', 'rory', 'rosario', 'roscoe', 'ross', 'rowan', 'rowdy',
  'rowland', 'roy', 'royal', 'royce', 'ruben', 'rudolph', 'rudy', 'rufus', 'rupert', 'russ',
  'russel', 'russell', 'rusty', 'ryan', 'ryder', 'ryker', 'rylan', 'ryland', 'sabian', 'sage',
  'sal', 'salvador', 'salvatore', 'sam', 'sammie', 'sammy', 'samson', 'samuel', 'sanders', 'sanford',
  'santiago', 'santos', 'saul', 'sawyer', 'scott', 'scottie', 'scotty', 'seamus', 'sean', 'sebastian',
  'selby', 'selwyn', 'semir', 'sergio', 'seth', 'seymour', 'shamus', 'shane', 'shannon', 'shaun',
  'shawn', 'shay', 'shayne', 'shea', 'sheldon', 'shelton', 'sheridan', 'sherman', 'sherwood', 'shimon',
  'shon', 'sid', 'sidney', 'silas', 'simeon', 'simon', 'simpson', 'sinclair', 'skylar', 'skyler',
  'sol', 'solomon', 'sonny', 'spencer', 'spenser', 'spiro', 'stacy', 'stan', 'stanford', 'stanislaus',
  'stanley', 'stanton', 'stefan', 'stephan', 'stephen', 'sterling', 'steve', 'steven', 'stevie', 'stewart',
  'stirling', 'stone', 'stuart', 'sullivan', 'sylvester', 'tabor', 'tad', 'taj', 'talan', 'talen',
  'talmadge', 'talon', 'tanner', 'tate', 'tatum', 'tavaris', 'tavian', 'tavion', 'taylor', 'ted',
  'teddy', 'terance', 'terence', 'terrance', 'terrell', 'terrence', 'terry', 'thad', 'thaddeus', 'theodore',
  'theron', 'thomas', 'thor', 'thorin', 'thurman', 'tim', 'timmy', 'timothy', 'titus', 'tobias',
  'tobin', 'toby', 'todd', 'tom', 'tomas', 'tommie', 'tommy', 'tony', 'trace', 'tracey',
  'tracy', 'travis', 'trent', 'trenton', 'trever', 'trevin', 'trevon', 'trevor', 'trey', 'tristan',
  'tristen', 'tristian', 'tristin', 'triston', 'troy', 'tucker', 'turner', 'ty', 'tyan', 'tye',
  'tyler', 'tylerek', 'tylor', 'tyree', 'tyreek', 'tyreese', 'tyrell', 'tyrese', 'tyron', 'tyrone',
  'tyshawn', 'tyson', 'ulises', 'ulysses', 'uriel', 'val', 'valentin', 'valentine', 'valentino', 'valerie',
  'van', 'vance', 'vaughn', 'vic', 'vicente', 'victor', 'vince', 'vincent', 'vincenzo', 'virgil',
  'vito', 'vlad', 'vladimir', 'vladislav', 'wade', 'waldo', 'walker', 'wallace', 'wally', 'walter',
  'walton', 'ward', 'warren', 'waylon', 'wayne', 'weldon', 'wendell', 'werner', 'wes', 'wesley',
  'weston', 'wilber', 'wilbert', 'wilbur', 'wiley', 'wilford', 'wilfred', 'wilfredo', 'will', 'willard',
  'william', 'williams', 'willie', 'willis', 'wilmer', 'wilson', 'wilton', 'windsor', 'winston', 'woodrow',
  'woody', 'wyatt', 'wyndham', 'wyman', 'xander', 'xavier', 'xylon', 'yadiel', 'yael', 'yale',
  'yancey', 'yasir', 'yasin', 'yasser', 'yehuda', 'yosef', 'yuri', 'yusuf', 'zach', 'zachariah',
  'zachary', 'zachery', 'zack', 'zackary', 'zackery', 'zaid', 'zain', 'zaire', 'zander', 'zane',
  'zayd', 'zayn', 'zeke', 'zephaniah', 'zeus', 'zion'
]);

class GenderDetector {
  /**
   * Extract clean first name from various LinkedIn formats
   */
  static cleanFirstName(rawName = '') {
    if (!rawName || typeof rawName !== 'string') return '';

    let clean = rawName
      .replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.|er\.|ca\.)\s+/i, '')
      .replace(/\s*•.*$/, '')
      .replace(/\s*\(.*?\)/g, '') // remove parenthesized nicknames/pronouns
      .replace(/[,|/\\-].*$/, '') // remove titles after punctuation
      .trim();

    const parts = clean.split(/\s+/).filter(Boolean);
    const firstName = (parts[0] || '').toLowerCase().replace(/[^a-z]/g, '');
    return firstName;
  }

  /**
   * Detect gender from person's name, headline, card text, or bio
   * @param {Object} candidate
   * @returns {{ gender: 'female' | 'male' | 'non_binary' | 'unknown', confidence: string, method: string, pronouns: string }}
   */
  static detectGender(candidate = {}) {
    const name = candidate.personName || candidate.name || '';
    const headline = candidate.headline || candidate.jobTitle || '';
    const cardText = candidate.cardText || '';
    const subline = candidate.subline || '';
    const profileText = candidate.profileText || '';

    const combinedText = `${name} ${headline} ${cardText} ${subline} ${profileText}`.toLowerCase();

    // 1. Check Pronouns first (highest confidence)
    if (FEMALE_PRONOUNS_REGEX.test(combinedText)) {
      return { gender: 'female', confidence: 'high', method: 'pronouns', pronouns: 'she/her' };
    }
    if (MALE_PRONOUNS_REGEX.test(combinedText)) {
      return { gender: 'male', confidence: 'high', method: 'pronouns', pronouns: 'he/him' };
    }
    if (NON_BINARY_PRONOUNS_REGEX.test(combinedText)) {
      return { gender: 'non_binary', confidence: 'high', method: 'pronouns', pronouns: 'they/them' };
    }

    // 2. Check First Name against dictionary
    const firstName = this.cleanFirstName(name);
    if (firstName && firstName.length >= 2) {
      if (FEMALE_NAMES.has(firstName)) {
        return { gender: 'female', confidence: 'medium', method: 'first_name', pronouns: '' };
      }
      if (MALE_NAMES.has(firstName)) {
        return { gender: 'male', confidence: 'medium', method: 'first_name', pronouns: '' };
      }
    }

    // 3. Fallback: Unknown
    return { gender: 'unknown', confidence: 'low', method: 'none', pronouns: '' };
  }

  /**
   * Check if candidate satisfies target gender filter
   * @param {Object} candidate
   * @param {string} targetFilter 'all' | 'female' | 'male'
   * @returns {boolean}
   */
  static matchesFilter(candidate, targetFilter = 'all') {
    const filter = (targetFilter || 'all').toLowerCase().trim();
    if (!filter || filter === 'all' || filter === 'any' || filter === 'both') {
      return true;
    }

    const detected = candidate.gender 
      ? candidate 
      : this.detectGender(candidate);

    if (filter === 'female') {
      return detected.gender === 'female';
    }
    if (filter === 'male') {
      return detected.gender === 'male';
    }

    return true;
  }
}

module.exports = GenderDetector;
