
AWS_ACCESS_KEY_ID=$(aws --profile default configure get aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(aws --profile default configure get aws_secret_access_key)

key_length=`echo $AWS_ACCESS_KEY_ID | wc -c` 
secret_length=`echo $AWS_SECRET_ACCESS_KEY | wc -c`

if [ $key_length -eq '21' -a $secret_length -eq '41' ] ; then
    echo "your access key is $AWS_ACCESS_KEY_ID"
    echo "your access key is $AWS_SECRET_ACCESS_KEY"
    docker build -t test -f Dockerfile .. --build-arg AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID --build-arg AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
    exit 0
fi
