import time
import PyPDF2
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
# Page config
from langchain.memory import ConversationSummaryBufferMemory
from .model import embeddings, llm, load_qa_chain,api_key 
import os
from .sharedict import session_state


FAISS_INDEX_PATH = "faiss_index"



if "document_search" not in session_state or session_state["document_search"] is None:
    if os.path.exists(FAISS_INDEX_PATH):
        try:

            session_state["document_search"] = FAISS.load_local(
                FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True
            )
            print("Loaded pre-built FAISS index from disk.")
        except Exception as e:
            print(f"Could not load FAISS index: {e}")
    else:
        print("No pre-built FAISS index found. Please upload a document to create one.")
        session_state["document_search"] = None

# Function to extract text from PDF
def extract_text_from_pdf(pdf_file):
    raw_text = ''
    pdfreader = PyPDF2.PdfReader(pdf_file)
    for i, page in enumerate(pdfreader.pages):
        content = page.extract_text()
        if content:
            raw_text += content
    return raw_text

# Function to extract text from TXT file
def extract_text_from_txt(txt_file):
    return txt_file.read().decode("utf-8")

# Initialize QA chain


memory = ConversationSummaryBufferMemory(
    llm=llm,
    max_token_limit=2000,  # Adjust this limit based on your needs
    return_messages=True,
    memory_key="chat_history",
  
)

chain = load_qa_chain(llm)
def chat_input(user_input):
    # user_input = input(prompt)
    
    if user_input:
       # session_state.messages.append({"role": "user", "content": user_input})

        if session_state["document_search"]:
            docs = session_state["document_search"].similarity_search(user_input)
            input_data = {
                    "context": docs,
                    "question": user_input ,
                        "chat_history": memory.load_memory_variables({}).get("chat_history", [])
                }
                
            response = chain.invoke(input_data)
            # response = chain.run(input_documents=docs, question=user_input)
        else:
            input_data = {
                    "context": "",
                    "question": user_input ,
                        "chat_history": memory.load_memory_variables({}).get("chat_history", [])
                }
            response = chain.invoke(input_data)
            
      
        memory.save_context(
            {"input": user_input},
            {"output": response}
        )
        
       
        #

        # Simulate typing effect
        # full_response = ""
        # for word in response.split():
        #     full_response += word + " "
        #     print(full_response, end='\r', flush=True)
        #     time.sleep(0.05)
        # print("-------------------------------------------------------------------------------")
        # print(response)  # Print the final response with a newline
        return response
    else:
        # print("No input provided. Please ask a question.")
        return "No input provided. Please ask a question."
        

# chat_input("Ask a question:  ")