//graph iterative transformation
function graph_it(params={})
{
    //this.spinner = document.getElementById('spinner');
    //this.spinner.style.visibility='block';
    
    //allows named parameters in any order, set defaults and prevent changing of parameters
    this.iterations              = (params.iterations              == undefined) ? 4                 : params.iterations;
    this.luminosity              = (params.luminosity              == undefined) ? 1                 : params.luminosity;
    this.center_x                = (params.center_x                == undefined) ? 0                 : params.center_x;
    this.center_y                = (params.center_y                == undefined) ? 0                 : params.center_y;
    this.samples_per_pixel       = (params.samples_per_pixel       == undefined) ? 1                 : params.samples_per_pixel;
    this.scale                   = (params.scale                   == undefined) ? 0.025 / 4         : params.scale;
    this.red_iteration           = (params.red_iteration           == undefined) ? 4                 : params.red_iteration;
    this.green_iteration         = (params.green_iteration         == undefined) ? 3                 : params.green_iteration;
    this.blue_iteration          = (params.blue_iteration          == undefined) ? 2                 : params.blue_iteration;
    this.use_screen_size         = (params.use_screen_size         == undefined) ? true              : params.use_screen_size;
    this.log_progress            = (params.log_progress            == undefined) ? false             : params.log_progress;
    this.enlargement_factor      = (params.enlargement_factor      == undefined) ? 1                 : params.enlargement_factor;
    this.dpi                     = (params.dpi                     == undefined) ? 300               : params.dpi;
    this.long_edge_inches        = (params.long_edge_inches        == undefined) ? 3                 : params.long_edge_inches;
    this.aspect_ration           = (params.aspect_ration           == undefined) ? 16/9              : params.aspect_ration;
    this.color_map_callback      = (params.color_map_callback      == undefined) ? function(){}      : params.color_map_callback;
    this.transformation_callback = (params.transformation_callback == undefined) ? function(o)
    {
        o.new_x = o.x**2-o.y**2-1;
        o.new_y = 2*o.x*o.y;                                                                        
    }                                                                                                : params.transformation_callback;
    this.red_callback            = (params.red_callback            == undefined) ? function(o)
    {
        return ((o.velocity + 256)/(o.velocity / o.luminosity + 1)) - 1;
    }                                                                                                : params.red_callback;
    this.green_callback          = (params.green_callback          == undefined) ? this.red_callback : params.green_callback;
    this.blue_callback           = (params.blue_callback           == undefined) ? this.red_callback : params.blue_callback;
    this.velocity_callback       = (params.velocity_callback       == undefined) ? function(o)
    {
        return Math.sqrt(((o.x-o.old_x)**2+(o.y-o.old_y)**2));
    }                                                                                                : params.velocity_callback;

    //set up canvas
    if (this.use_screen_size == true)
    {
        this.width  = $(window).width();
        this.height = $(window).height()        
    }
    else
    {
        this.scale  /=  this.enlargement_factor;
        this.width  =     this.enlargement_factor
                        * this.dpi
                        * (   (this.aspect_ratio>1)
                            ? this.long_edge_inches
                            : this.long_edge_inches * this.aspect_ratio   );
        this.height =   this.enlargement_factor
                      * this.dpi
                      *   (   (this.aspect_ratio>1)
                            ? this.long_edge_inches / this.aspect_ratio
                            : this.long_edge_inches                       );
    }
    this.canvas     = document.getElementById('canvas');
    this.ctx        = canvas.getContext('2d');
    canvas.width    = this.width;
    canvas.height   = this.height;
    if (this.use_screen_size == false)
    {
        if ( this.aspect_ratio < ($(window).width() / $(window).height()))
        {
            this.canvas.style.width='100vw';
        }
        else
        {
            this.canvas.style.height='100vh';
        }
    }
    this.ImageData = this.ctx.createImageData(this.width, this.height);

    //render
    this.original_x = this.original_y = this.image_x =this.image_y = 0;
    this.k = this.l = 0;
    this.new_x = this.new_y = this.velocity = this.old_x = this.old_y = 0;
    for (this.image_x=0; this.image_x<this.width; this.image_x++)
    {
        if (this.log_progress)
        {
            if ((this.image_x % 100) == 0) console.log(100*this.image_x/this.width+'%');
        }
        for (this.image_y=0; this.image_y<this.height; this.image_y++)
        {
            this.red_value = 0;
            this.green_value = 0;
            this.blue_value = 0;
            for (this.k=0; this.k<this.samples_per_pixel; this.k++)
            for (this.l=0; this.l<this.samples_per_pixel; this.l++)
            {
                this.original_x = this.x =   (this.image_x-this.width/2)*this.scale 
                                           + this.center_x 
                                           + ((this.scale/this.samples_per_pixel) * (this.k - ((this.samples_per_pixel-1)/2) ));
                this.original_y = this.y =   (this.image_y-this.height/2)*this.scale*(-1) 
                                           + this.center_y 
                                           + ((this.scale/this.samples_per_pixel) * (this.l - ((this.samples_per_pixel-1)/2) ));
                for (this.i=0; this.i<this.iterations; ++this.i)
                {
                    this.old_x = this.x;
                    this.old_y = this.y;
                    this.transformation_callback(this);
                    this.x = this.new_x;
                    this.y = this.new_y;
                    if (    (this.i + 1) == this.red_iteration
                         || (this.i + 1) == this.green_iteration 
                         || (this.i + 1) == this.blue_iteration  )
                    {
                        this.velocity = this.velocity_callback(this);
                        if ((this.i + 1) == this.red_iteration)
                        {
                            this.red_value += this.red_callback(this);
                        }
                        if ((this.i + 1) == this.green_iteration)
                        {
                            this.green_value +=  this.green_callback(this);
                        }
                        if ((this.i + 1) == this.blue_iteration)
                        {
                            this.blue_value += this.blue_callback(this);
                        }
                    }
                }
            }
            this.red_value /= this.samples_per_pixel**2;
            this.green_value /= this.samples_per_pixel**2;
            this.blue_value /= this.samples_per_pixel**2;
            
            this.color_map_callback(this);
            
            this.index = (this.image_x + this.image_y * this.ImageData.width) * 4;
            this.ImageData.data[this.index+0] = this.red_value;
            this.ImageData.data[this.index+1] = this.green_value;
            this.ImageData.data[this.index+2] = this.blue_value;
            this.ImageData.data[this.index+3] = 255; //opaque
        }
    }
    this.ctx.putImageData(this.ImageData, 0, 0);
    if (this.log_progress) console.log('Rendered.');
    //this.spinner.style.display='none';
    
}        
    /*
        function transformation1(o) {
            if (o.i<2)
            {
                o.new_x = o.x**2-o.y**2-1;
                o.new_y = 2*o.x*o.y;                                                                        
            }
            else if (o.i<o.iterations-1)
            {
                o.new_x = (o.x/2)+Math.sin(o.y*2);
                o.new_y = (o.y/2)+Math.sin(o.x*2);                                    
            }
            else
            {
                o.new_x = o.x;
                o.new_y = Math.tan(o.x**2+o.y**2);                        
            }  
        }
    */
    /*    
        function color_callback1(o)
        {
            return (o.velocity > o.luminosity) ? 0 : 255;
        }
    */
    /*    
        function color_map(colors)
        {
            
            colors.red_value = colors.green_value 
                             = colors.blue_value 
                             = (   colors.red_value 
                                 * colors.green_value
                                 * colors.blue_value  ) ** (1/3);
            
            //red_value = green_value = blue_value = 255 - (red_value*green_value*blue_value) ** (1/3);
            //red_value = green_value = blue_value = (red_value+green_value+blue_value) / 3;
            //red_value = green_value = blue_value = 255 - (red_value + green_value + blue_value) / 3;
            //red_value = 255 - red_value;
            //green_value = 255 - green_value;
            //blue_value = 255 - blue_value;
        }
    */
