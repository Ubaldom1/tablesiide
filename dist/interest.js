const form=document.querySelector('#interest-form'),status=document.querySelector('#form-status');
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('button');button.disabled=true;button.textContent='Sending…';status.textContent='';
 const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;data.finishes=new FormData(form).getAll("finishes");
 try {const response=await fetch('/api/interest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'Please try again.');form.reset();status.textContent='Thank you. Your interest has been received. We’ll be in touch about The Rack.';}
 catch(error){status.textContent=error.message||'We could not connect. Please try again.';}
 finally{button.disabled=false;button.textContent='Register interest';}
});
